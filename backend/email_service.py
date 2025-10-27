import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import os
from datetime import datetime

class EmailService:
    def __init__(self):
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = os.getenv("GMAIL_USER")
        self.sender_password = os.getenv("GMAIL_REFRESH_TOKEN")  # Using refresh token as password
        
    async def send_email(self, to_email: str, subject: str, html_content: str):
        """Send email using Gmail SMTP"""
        try:
            message = MIMEMultipart("alternative")
            message["From"] = self.sender_email
            message["To"] = to_email
            message["Subject"] = subject
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                start_tls=True,
                username=self.sender_email,
                password=self.sender_password,
            )
            return True
        except Exception as e:
            print(f"Email sending failed: {e}")
            return False
    
    async def send_order_confirmation(self, order_data: dict, user_email: str):
        """Send order confirmation email with invoice"""
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                .order-details { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                .item { border-bottom: 1px solid #ddd; padding: 10px 0; }
                .total { font-size: 20px; font-weight: bold; color: #4CAF50; }
                .footer { text-align: center; color: #666; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SKYRITING</h1>
                    <p>Order Confirmation</p>
                </div>
                
                <p>Thank you for your order!</p>
                
                <div class="order-details">
                    <h2>Order #{{ order_id }}</h2>
                    <p><strong>Date:</strong> {{ date }}</p>
                    <p><strong>Status:</strong> {{ status }}</p>
                    
                    <h3>Items:</h3>
                    {% for item in items %}
                    <div class="item">
                        <p><strong>{{ item.name }}</strong></p>
                        <p>Quantity: {{ item.quantity }} × ${{ item.price }}</p>
                    </div>
                    {% endfor %}
                    
                    <p class="total">Total: ${{ total }}</p>
                </div>
                
                <div class="footer">
                    <p>Questions? Contact us at {{ support_email }}</p>
                    <p>© 2025 Skyriting. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        html_content = Template(template).render(
            order_id=order_data.get("order_id", "N/A"),
            date=datetime.now().strftime("%B %d, %Y"),
            status=order_data.get("status", "pending").capitalize(),
            items=order_data.get("items", []),
            total=order_data.get("total_amount", 0),
            support_email=self.sender_email
        )
        
        return await self.send_email(
            user_email,
            f"Order Confirmation - #{order_data.get('order_id', 'N/A')}",
            html_content
        )
    
    async def send_order_status_update(self, order_data: dict, user_email: str):
        """Send order status update email"""
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                .status-update { background: #f0f8ff; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SKYRITING</h1>
                    <p>Order Update</p>
                </div>
                
                <div class="status-update">
                    <h2>Order #{{ order_id }}</h2>
                    <p><strong>New Status:</strong> {{ status }}</p>
                    <p>{{ message }}</p>
                </div>
                
                <p>Thank you for shopping with Skyriting!</p>
            </div>
        </body>
        </html>
        """
        
        status_messages = {
            "confirmed": "Your order has been confirmed and is being prepared.",
            "shipped": "Great news! Your order has been shipped and is on the way.",
            "delivered": "Your order has been delivered. We hope you love it!",
            "cancelled": "Your order has been cancelled as requested."
        }
        
        html_content = Template(template).render(
            order_id=order_data.get("order_id", "N/A"),
            status=order_data.get("status", "pending").capitalize(),
            message=status_messages.get(order_data.get("status"), "Your order status has been updated.")
        )
        
        return await self.send_email(
            user_email,
            f"Order #{order_data.get('order_id')} - Status Update",
            html_content
        )

email_service = EmailService()
