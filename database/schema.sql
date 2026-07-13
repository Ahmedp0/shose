-- =====================================================
-- قاعدة بيانات نظام إدارة مخزون الأحذية
-- StepTrack Shoe Inventory Management System
-- PostgreSQL
-- =====================================================

-- حذف الجداول القديمة إن وُجدت
DROP VIEW IF EXISTS v_inventory_stats CASCADE;
DROP VIEW IF EXISTS v_pending_count CASCADE;
DROP VIEW IF EXISTS v_shoes_inventory CASCADE;
DROP TABLE IF EXISTS completed_orders CASCADE;
DROP TABLE IF EXISTS pending_orders CASCADE;
DROP TABLE IF EXISTS shoe_sizes CASCADE;
DROP TABLE IF EXISTS shoes CASCADE;

-- =====================================================
-- 1. جدول الأحذية (Shoes)
-- =====================================================
CREATE TABLE shoes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255)   NOT NULL,
    supplier      VARCHAR(255)   NOT NULL,
    color         VARCHAR(100)   NOT NULL,
    cost_price    DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    price         DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    image         VARCHAR(500)   NOT NULL DEFAULT '',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. جدول مقاسات الأحذية (Shoe Sizes)
-- كل حذاء له عدة مقاسات، كل مقاس له كمية فقط
-- لا يوجد حقل reserved — الكمية تُنقص مباشرة عند البيع
-- =====================================================
CREATE TABLE shoe_sizes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shoe_id       UUID           NOT NULL REFERENCES shoes(id) ON DELETE CASCADE,
    size          DECIMAL(4, 1)  NOT NULL,
    quantity      INTEGER        NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shoe_id, size)
);

-- =====================================================
-- 3. جدول الطلبات المعلقة (Pending Orders)
-- طلبات لم تُسلّم بعد — عند البيع يُنشأ سجل هنا
-- والكمية تُنقص من المخزون مباشرة عند البيع
-- =====================================================
CREATE TABLE pending_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(20)    NOT NULL UNIQUE,
    shoe_id         UUID           NOT NULL REFERENCES shoes(id) ON DELETE RESTRICT,
    shoe_name       VARCHAR(255)   NOT NULL,
    shoe_supplier   VARCHAR(255)   NOT NULL,
    shoe_color      VARCHAR(100)   NOT NULL,
    shoe_image      VARCHAR(500)   NOT NULL DEFAULT '',
    shoe_cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    shoe_price      DECIMAL(12, 2) NOT NULL CHECK (shoe_price >= 0),
    size            DECIMAL(4, 1)  NOT NULL,
    quantity        INTEGER        NOT NULL CHECK (quantity > 0),
    total_price     DECIMAL(12, 2) NOT NULL CHECK (total_price >= 0),
    buyer_name      VARCHAR(255)   NOT NULL,
    buyer_phone     VARCHAR(30)    NOT NULL DEFAULT '',
    governorate     VARCHAR(100)   NOT NULL,
    notes           TEXT           NOT NULL DEFAULT '',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. جدول الطلبات المكتملة (Completed Orders)
-- الطلبات التي سُلّمت أو أُرجعت
-- تنتقل من pending_orders هنا عند التسليم أو الإرجاع
-- =====================================================
CREATE TABLE completed_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(20)    NOT NULL UNIQUE,
    shoe_id         UUID           NOT NULL REFERENCES shoes(id) ON DELETE RESTRICT,
    shoe_name       VARCHAR(255)   NOT NULL,
    shoe_supplier   VARCHAR(255)   NOT NULL,
    shoe_color      VARCHAR(100)   NOT NULL,
    shoe_image      VARCHAR(500)   NOT NULL DEFAULT '',
    shoe_cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    shoe_price      DECIMAL(12, 2) NOT NULL CHECK (shoe_price >= 0),
    size            DECIMAL(4, 1)  NOT NULL,
    quantity        INTEGER        NOT NULL CHECK (quantity > 0),
    total_price     DECIMAL(12, 2) NOT NULL CHECK (total_price >= 0),
    buyer_name      VARCHAR(255)   NOT NULL,
    buyer_phone     VARCHAR(30)    NOT NULL DEFAULT '',
    governorate     VARCHAR(100)   NOT NULL,
    notes           TEXT           NOT NULL DEFAULT '',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at    TIMESTAMP WITH TIME ZONE,
    returned_at     TIMESTAMP WITH TIME ZONE,
    return_reason   VARCHAR(500)   NOT NULL DEFAULT ''
);

-- =====================================================
-- الفهارس (Indexes)
-- =====================================================

-- shoe_sizes
CREATE INDEX idx_shoe_sizes_shoe_id ON shoe_sizes(shoe_id);

-- pending_orders
CREATE INDEX idx_pending_order_number  ON pending_orders(order_number);
CREATE INDEX idx_pending_shoe_id       ON pending_orders(shoe_id);
CREATE INDEX idx_pending_buyer_name    ON pending_orders(buyer_name);
CREATE INDEX idx_pending_governorate   ON pending_orders(governorate);
CREATE INDEX idx_pending_created_at    ON pending_orders(created_at DESC);

-- completed_orders
CREATE INDEX idx_completed_order_number    ON completed_orders(order_number);
CREATE INDEX idx_completed_shoe_id         ON completed_orders(shoe_id);
CREATE INDEX idx_completed_buyer_name      ON completed_orders(buyer_name);
CREATE INDEX idx_completed_governorate     ON completed_orders(governorate);
CREATE INDEX idx_completed_created_at      ON completed_orders(created_at DESC);
CREATE INDEX idx_completed_completed_at    ON completed_orders(completed_at DESC);
CREATE INDEX idx_completed_returned_at     ON completed_orders(returned_at DESC);

-- shoes
CREATE INDEX idx_shoes_supplier     ON shoes(supplier);
CREATE INDEX idx_shoes_created_at   ON shoes(created_at DESC);

-- =====================================================
-- دالة تحديث updated_at تلقائياً
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shoes_updated_at
    BEFORE UPDATE ON shoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- دالة توليد رقم الطلب التلقائي
-- =====================================================
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pending_order_number
    BEFORE INSERT ON pending_orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER trg_completed_order_number
    BEFORE INSERT ON completed_orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- =====================================================
-- Views
-- =====================================================

-- عرض الأحذية مع مجموع مقاساتها (بدون reserved)
CREATE OR REPLACE VIEW v_shoes_inventory AS
SELECT
    s.id,
    s.name,
    s.supplier,
    s.color,
    s.cost_price,
    s.price,
    s.image,
    s.created_at,
    s.updated_at,
    COALESCE(SUM(ss.quantity), 0) AS total_quantity,
    COALESCE(SUM(ss.quantity), 0) AS available_quantity
FROM shoes s
LEFT JOIN shoe_sizes ss ON s.id = ss.shoe_id
GROUP BY s.id, s.name, s.supplier, s.color, s.cost_price, s.price, s.image, s.created_at, s.updated_at;

-- عدد الطلبات المعلقة لكل حذاء
CREATE OR REPLACE VIEW v_pending_count AS
SELECT shoe_id, COUNT(*) AS pending_count
FROM pending_orders
GROUP BY shoe_id;

-- إحصائيات المخزون الكاملة
CREATE OR REPLACE VIEW v_inventory_stats AS
SELECT
    (SELECT COUNT(*) FROM shoes)                                                    AS total_shoes,
    (SELECT COALESCE(SUM(quantity), 0) FROM shoe_sizes)                             AS total_units,
    (SELECT COALESCE(SUM(quantity), 0) FROM shoe_sizes)                             AS available_units,
    (SELECT COUNT(*) FROM pending_orders)                                           AS pending_orders_count,
    (SELECT COUNT(*) FROM completed_orders WHERE completed_at IS NOT NULL)          AS completed_orders_count,
    (SELECT COUNT(*) FROM completed_orders WHERE returned_at IS NOT NULL)           AS returned_orders_count,
    (SELECT COALESCE(SUM(total_price), 0) FROM completed_orders
     WHERE completed_at IS NOT NULL)                                                AS total_revenue,
    (SELECT COALESCE(SUM(total_price - (shoe_cost_price * quantity)), 0)
     FROM completed_orders WHERE completed_at IS NOT NULL)                          AS total_profit;