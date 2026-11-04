ALTER TABLE `Product` ADD CONSTRAINT `chk_product_stock` CHECK (`stock` >= 0);
ALTER TABLE `Product` ADD CONSTRAINT `chk_product_price` CHECK (`priceCents` >= 0);
ALTER TABLE `OrderItem` ADD CONSTRAINT `chk_order_item_qty` CHECK (`quantity` > 0);