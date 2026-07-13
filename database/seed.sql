-- =====================================================
-- بيانات تجريبية - StepTrack Shoe Inventory
-- =====================================================

-- ─────────────────────────────────────────────
-- الأحذية (6 أحذية) — مع cost_price
-- ─────────────────────────────────────────────
INSERT INTO shoes (id, name, supplier, color, cost_price, price, image) VALUES
('10000000-0000-0000-0000-000000000001', 'Air Max 270',       'Nike',    'أبيض',   6000.00, 12500.00, 'https://images.unsplash.com/photo-1641687589434-a86e8de59855?w=600&h=400&fit=crop&auto=format'),
('10000000-0000-0000-0000-000000000002', 'Ultraboost Light',  'Adidas',  'أسود',  10000.00, 18900.00, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop&auto=format'),
('10000000-0000-0000-0000-000000000003', 'Classic Leather',   'Reebok',  'رمادي',  5000.00,  9500.00, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop&auto=format'),
('10000000-0000-0000-0000-000000000004', 'Old Skool',         'Vans',    'أسود',   4000.00,  7800.00, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&h=400&fit=crop&auto=format'),
('10000000-0000-0000-0000-000000000005', 'Chuck 70',          'Converse','أبيض',   4500.00,  8200.00, 'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=600&h=400&fit=crop&auto=format'),
('10000000-0000-0000-0000-000000000006', 'Suede Classic',     'Puma',    'أزرق',   6000.00, 11000.00, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop&auto=format');

-- ─────────────────────────────────────────────
-- مقاسات الأحذية (بدون reserved — الكمية فقط)
-- ─────────────────────────────────────────────

-- Air Max 270
INSERT INTO shoe_sizes (shoe_id, size, quantity) VALUES
('10000000-0000-0000-0000-000000000001', 40, 10),
('10000000-0000-0000-0000-000000000001', 41, 15),
('10000000-0000-0000-0000-000000000001', 42, 12),
('10000000-0000-0000-0000-000000000001', 43,  8),
('10000000-0000-0000-0000-000000000001', 44,  5);

-- Ultraboost Light
INSERT INTO shoe_sizes (shoe_id, size, quantity) VALUES
('10000000-0000-0000-0000-000000000002', 40,  8),
('10000000-0000-0000-0000-000000000002', 41, 12),
('10000000-0000-0000-0000-000000000002', 42, 10),
('10000000-0000-0000-0000-000000000002', 43,  6),
('10000000-0000-0000-0000-000000000002', 44,  4);

-- Classic Leather
INSERT INTO shoe_sizes (shoe_id, size, quantity) VALUES
('10000000-0000-0000-0000-000000000003', 40,  5),
('10000000-0000-0000-0000-000000000003', 41,  8),
('10000000-0000-0000-0000-000000000003', 42,  0),
('10000000-0000-0000-0000-000000000003', 43,  3),
('10000000-0000-0000-0000-000000000003', 44,  2);

-- Old Skool
INSERT INTO shoe_sizes (shoe_id, size, quantity) VALUES
('10000000-0000-0000-0000-000000000004', 40,  6),
('10000000-0000-0000-0000-000000000004', 41, 10),
('10000000-0000-0000-0000-000000000004', 42,  8),
('10000000-0000-0000-0000-000000000004', 43,  4),
('10000000-0000-0000-0000-000000000004', 44,  2);

-- Chuck 70
INSERT INTO shoe_sizes (shoe_id, size, quantity) VALUES
('10000000-0000-0000-0000-000000000005', 40,  4),
('10000000-0000-0000-0000-000000000005', 41,  6),
('10000000-0000-0000-0000-000000000005', 42,  8),
('10000000-0000-0000-0000-000000000005', 43,  5),
('10000000-0000-0000-0000-000000000005', 44,  3);

-- Suede Classic
INSERT INTO shoe_sizes (shoe_id, size, quantity) VALUES
('10000000-0000-0000-0000-000000000006', 40,  7),
('10000000-0000-0000-0000-000000000006', 41,  9),
('10000000-0000-0000-0000-000000000006', 42, 11),
('10000000-0000-0000-0000-000000000006', 43,  6),
('10000000-0000-0000-0000-000000000006', 44,  4);

-- ─────────────────────────────────────────────
-- الطلبات المعلقة (3 طلبات) — مع phone و notes
-- ─────────────────────────────────────────────
INSERT INTO pending_orders (id, shoe_id, shoe_name, shoe_supplier, shoe_color, shoe_image, shoe_cost_price, shoe_price, size, quantity, total_price, buyer_name, buyer_phone, governorate, notes, created_at) VALUES
('20000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001',
 'Air Max 270', 'Nike', 'أبيض',
 'https://images.unsplash.com/photo-1641687589434-a86e8de59855?w=600&h=400&fit=crop&auto=format',
 6000.00, 12500.00, 41, 2, 25000.00,
 'أحمد محمد', '07701234567', 'بغداد',
 'يفضل التسليم مساءً',
 CURRENT_TIMESTAMP - INTERVAL '2 days'),

('20000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000002',
 'Ultraboost Light', 'Adidas', 'أسود',
 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop&auto=format',
 10000.00, 18900.00, 40, 1, 18900.00,
 'سارة العلي', '07809876543', 'البصرة',
 '',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

('20000000-0000-0000-0000-000000000003',
 '10000000-0000-0000-0000-000000000004',
 'Old Skool', 'Vans', 'أسود',
 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&h=400&fit=crop&auto=format',
 4000.00, 7800.00, 41, 3, 23400.00,
 'خالد الرشيد', '07715554433', 'نينوى',
 'العنوان:شارع المتنبي',
 CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- ─────────────────────────────────────────────
-- الطلبات المكتملة (3 طلبات) — 2 تم التسليم + 1 أُرجع
-- ─────────────────────────────────────────────

-- طلب تم التسليم
INSERT INTO completed_orders (id, order_number, shoe_id, shoe_name, shoe_supplier, shoe_color, shoe_image, shoe_cost_price, shoe_price, size, quantity, total_price, buyer_name, buyer_phone, governorate, notes, created_at, completed_at) VALUES
('30000000-0000-0000-0000-000000000001',
 'ORD-000001',
 '10000000-0000-0000-0000-000000000001',
 'Air Max 270', 'Nike', 'أبيض',
 'https://images.unsplash.com/photo-1641687589434-a86e8de59855?w=600&h=400&fit=crop&auto=format',
 6000.00, 12500.00, 42, 3, 37500.00,
 'محمد الصقر', '07708889999', 'أربيل',
 '',
 CURRENT_TIMESTAMP - INTERVAL '5 days',
 CURRENT_TIMESTAMP - INTERVAL '4 days');

-- طلب آخر تم التسليم
INSERT INTO completed_orders (id, order_number, shoe_id, shoe_name, shoe_supplier, shoe_color, shoe_image, shoe_cost_price, shoe_price, size, quantity, total_price, buyer_name, buyer_phone, governorate, notes, created_at, completed_at) VALUES
('30000000-0000-0000-0000-000000000002',
 'ORD-000002',
 '10000000-0000-0000-0000-000000000003',
 'Classic Leather', 'Reebok', 'رمادي',
 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop&auto=format',
 5000.00, 9500.00, 41, 2, 19000.00,
 'فاطمة الزهراء', '07801112233', 'النجف',
 '',
 CURRENT_TIMESTAMP - INTERVAL '3 days',
 CURRENT_TIMESTAMP - INTERVAL '2 days');

-- طلب أُرجع (returned) — لا يوجد completed_at لكن يوجد returned_at
INSERT INTO completed_orders (id, order_number, shoe_id, shoe_name, shoe_supplier, shoe_color, shoe_image, shoe_cost_price, shoe_price, size, quantity, total_price, buyer_name, buyer_phone, governorate, notes, created_at, returned_at, return_reason) VALUES
('30000000-0000-0000-0000-000000000003',
 'ORD-000003',
 '10000000-0000-0000-0000-000000000005',
 'Chuck 70', 'Converse', 'أبيض',
 'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=600&h=400&fit=crop&auto=format',
 4500.00, 8200.00, 43, 1, 8200.00,
 'عمر الحسيني', '07703334455', 'كركوك',
 'العميل رفض الاستلام — مقاس غير مناسب',
 CURRENT_TIMESTAMP - INTERVAL '7 days',
 CURRENT_TIMESTAMP - INTERVAL '6 days',
 'مقاس غير مناسب');

-- ═══════════════════════════════════════════
-- ملاحظة: تم تعطيل الترقيم التلقائي مؤقتاً
-- للسماح بإدراج order_number يدوياً في البيانات التجريبية
-- ثم يُفعّل للطلبات المستقبلية
-- ═══════════════════════════════════════════
-- لإعادة تعيين العداد بعد الإدراج:
SELECT setval('order_number_seq', 3);