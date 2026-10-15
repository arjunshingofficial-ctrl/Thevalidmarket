# DATABASE.md - The Valid Market Schema Design

## Core Entities & Relationships

### Users & Auth
- **User:** id, name, username, email, phone, password_hash, role_id, created_at
- **Role:** id, name (Customer, Staff, Admin)
- **Permission:** id, name
- **Role_Permission:** role_id, permission_id

### Catalog
- **Category:** id, parent_id, name, slug, description, image, icon
- **Product:** id, category_id, name, slug, sku, type, price, sale_price, stock, status, metadata (JSON)
- **Product_Variant:** id, product_id, name, price_adjustment
- **Product_Field:** id, name, type (custom fields mapping)
- **Product_File:** id, product_id, filename, file_size, url_path, is_active

### Commerce
- **Order:** id, user_id, subtotal, discount, tax, total, payment_status, order_status
- **OrderItem:** id, order_id, product_id, price, quantity
- **Payment:** id, order_id, method, transaction_id, status, amount, currency, metadata
- **Coupon:** id, code, discount_type, discount_value, max_uses, current_uses, expires_at

### Fulfillment
- **License:** id, user_id, product_id, order_id, license_key, expires_at, status
- **Download:** id, user_id, product_file_id, order_id, download_count, last_download
- **Subscription:** id, user_id, product_id, order_id, status, starts_at, expires_at
- **CourseAccess:** id, user_id, course_id, progress

### Content & Support
- **Review:** id, user_id, product_id, rating, title, comment, status
- **SupportTicket:** id, user_id, subject, status, priority
- **BlogPost:** id, title, slug, content, author_id, status

*Note: We will use PostgreSQL and Prisma for modeling.*
