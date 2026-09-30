export interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const JAVA_PROJECT_STRUCTURE = `
POS_Inventory_System/
 ├── .idea/                      (IntelliJ project metadata)
 ├── src/
 │   └── main/
 │       ├── java/
 │       │   └── com/
 │       │       └── company/
 │       │           └── pos/
 │       │               ├── config/
 │       │               │   └── DBConnection.java
 │       │               ├── dao/
 │       │               │   ├── UserDAO.java
 │       │               │   ├── ProductDAO.java
 │       │               │   ├── CategoryDAO.java
 │       │               │   ├── CustomerDAO.java
 │       │               │   ├── SaleDAO.java
 │       │               │   └── StockDAO.java
 │       │               ├── model/
 │       │               │   ├── User.java
 │       │               │   ├── Product.java
 │       │               │   ├── Category.java
 │       │               │   ├── Customer.java
 │       │               │   ├── Sale.java
 │       │               │   └── SaleItem.java
 │       │               ├── servlet/
 │       │               │   ├── AuthServlet.java
 │       │               │   ├── ProductServlet.java
 │       │               │   ├── CategoryServlet.java
 │       │               │   ├── CustomerServlet.java
 │       │               │   ├── SalesServlet.java
 │       │               │   ├── InvoiceServlet.java
 │       │               │   ├── StockServlet.java
 │       │               │   └── ReportServlet.java
 │       │               └── filter/
 │       │                   └── AuthFilter.java
 │       ├── resources/
 │       │   └── db.properties
 │       └── webapp/
 │           ├── WEB-INF/
 │           │   └── web.xml
 │           ├── css/
 │           │   └── bootstrap.min.css
 │           ├── js/
 │           │   └── app.js
 │           ├── login.jsp
 │           ├── dashboard.jsp
 │           ├── products.jsp
 │           ├── pos.jsp
 │           ├── invoice.jsp
 │           ├── reports.jsp
 │           ├── customers.jsp
 │           └── stock.jsp
 ├── database/
 │   └── schema.sql
 └── pom.xml
`;

export const CODE_FILES: CodeFile[] = [
  {
    name: 'schema.sql',
    path: 'database/schema.sql',
    language: 'sql',
    description: 'Complete MySQL 8.0 Schema with tables, foreign keys, and seed records',
    code: `-- ==========================================================
-- Database Schema for POS & Sales Inventory Management System
-- Compatible with MySQL 8.0+
-- ==========================================================

CREATE DATABASE IF NOT EXISTS \`pos_inventory_db\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE \`pos_inventory_db\`;

-- 1. Users Table with Roles
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`phone\` VARCHAR(20),
  \`role\` ENUM('ADMIN', 'MANAGER', 'CASHIER') NOT NULL DEFAULT 'CASHIER',
  \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  \`last_login\` DATETIME NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`description\` TEXT,
  \`color\` VARCHAR(20) DEFAULT '#3B82F6',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Products Table
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sku\` VARCHAR(50) NOT NULL UNIQUE,
  \`barcode\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(150) NOT NULL,
  \`category_id\` INT NOT NULL,
  \`cost_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`selling_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`stock_quantity\` INT NOT NULL DEFAULT 0,
  \`min_stock_alert\` INT NOT NULL DEFAULT 10,
  \`unit\` VARCHAR(20) DEFAULT 'pcs',
  \`supplier\` VARCHAR(100),
  \`description\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_product_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100),
  \`phone\` VARCHAR(30) NOT NULL,
  \`address\` TEXT,
  \`total_spent\` DECIMAL(12,2) DEFAULT 0.00,
  \`credit_balance\` DECIMAL(10,2) DEFAULT 0.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Sales Orders Table
CREATE TABLE IF NOT EXISTS \`sales\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`invoice_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_id\` INT NULL,
  \`cashier_id\` INT NOT NULL,
  \`subtotal\` DECIMAL(10,2) NOT NULL,
  \`tax_rate\` DECIMAL(5,2) DEFAULT 0.08,
  \`tax_amount\` DECIMAL(10,2) NOT NULL,
  \`discount_amount\` DECIMAL(10,2) DEFAULT 0.00,
  \`total_amount\` DECIMAL(10,2) NOT NULL,
  \`payment_method\` ENUM('CASH', 'CARD', 'UPI', 'TRANSFER') NOT NULL,
  \`amount_received\` DECIMAL(10,2) NOT NULL,
  \`change_given\` DECIMAL(10,2) DEFAULT 0.00,
  \`payment_status\` ENUM('PAID', 'PENDING', 'REFUNDED') DEFAULT 'PAID',
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_sales_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_sales_cashier\` FOREIGN KEY (\`cashier_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Sale Items Detail Table
CREATE TABLE IF NOT EXISTS \`sale_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sale_id\` INT NOT NULL,
  \`product_id\` INT NOT NULL,
  \`quantity\` INT NOT NULL,
  \`unit_price\` DECIMAL(10,2) NOT NULL,
  \`cost_price\` DECIMAL(10,2) NOT NULL,
  \`discount\` DECIMAL(10,2) DEFAULT 0.00,
  \`total\` DECIMAL(10,2) NOT NULL,
  CONSTRAINT \`fk_item_sale\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_item_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Stock Audit & Inventory Movement Logs
CREATE TABLE IF NOT EXISTS \`stock_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`product_id\` INT NOT NULL,
  \`type\` ENUM('RESTOCK', 'SALE', 'DAMAGE', 'RETURN', 'AUDIT') NOT NULL,
  \`quantity_change\` INT NOT NULL,
  \`previous_stock\` INT NOT NULL,
  \`new_stock\` INT NOT NULL,
  \`reason\` VARCHAR(255) NOT NULL,
  \`user_id\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_log_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_log_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Initial Seed Data
INSERT INTO \`users\` (\`username\`, \`password_hash\`, \`full_name\`, \`email\`, \`role\`) VALUES
('admin', 'admin123', 'Van Ravid', 'admin@company.com', 'ADMIN'),
('manager', 'manager123', 'Phoeung Panha', 'manager@company.com', 'MANAGER'),
('cashier', 'cashier123', 'Ray Chanra', 'cashier@company.com', 'CASHIER');

INSERT INTO \`categories\` (\`code\`, \`name\`, \`description\`, \`color\`) VALUES
('BEV', 'Beverages & Drinks', 'Cold sodas, coffees, teas, sparkling waters', '#3B82F6'),
('SNK', 'Snacks & Bakery', 'Chips, cookies, pastries, nuts', '#F59E0B'),
('DRY', 'Dairy & Eggs', 'Milk, artisan cheeses, yogurts and eggs', '#10B981'),
('ELE', 'Electronics & Accessories', 'Cables, chargers, wireless headphones', '#8B5CF6'),
('PER', 'Personal Care', 'Soaps, lotions, sanitizers', '#EC4899');
`,
  },
  {
    name: 'DBConnection.java',
    path: 'src/main/java/com/company/pos/config/DBConnection.java',
    language: 'java',
    description: 'JDBC connection manager singleton for MySQL with auto-reconnect and resource safety',
    code: `package com.company.pos.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;
import java.io.InputStream;
import java.io.IOException;

/**
 * Singleton database connection manager utilizing JDBC.
 */
public class DBConnection {
    private static Connection connection = null;

    private static String url = "jdbc:mysql://localhost:3306/pos_inventory_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static String username = "root";
    private static String password = "password";

    static {
        try {
            // Load MySQL 8+ JDBC Driver
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            // Optional: read from db.properties if present
            try (InputStream input = DBConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
                if (input != null) {
                    Properties prop = new Properties();
                    prop.load(input);
                    url = prop.getProperty("db.url", url);
                    username = prop.getProperty("db.username", username);
                    password = prop.getProperty("db.password", password);
                }
            } catch (IOException ex) {
                System.out.println("Using default DB configuration.");
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to register MySQL JDBC Driver!", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            synchronized (DBConnection.class) {
                if (connection == null || connection.isClosed()) {
                    connection = DriverManager.getConnection(url, username, password);
                }
            }
        }
        return connection;
    }

    public static void closeConnection() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
`,
  },
  {
    name: 'ProductDAO.java',
    path: 'src/main/java/com/company/pos/dao/ProductDAO.java',
    language: 'java',
    description: 'Data Access Object executing SQL prepared statements for Product CRUD & Search',
    code: `package com.company.pos.dao;

import com.company.pos.config.DBConnection;
import com.company.pos.model.Product;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductDAO {

    public List<Product> getAllProducts() throws SQLException {
        List<Product> list = new ArrayList<>();
        String sql = "SELECT p.*, c.name as category_name FROM products p " +
                     "JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC";
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToProduct(rs));
            }
        }
        return list;
    }

    public List<Product> searchProducts(String query, Integer categoryId) throws SQLException {
        List<Product> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
            "SELECT p.*, c.name as category_name FROM products p " +
            "JOIN categories c ON p.category_id = c.id WHERE 1=1 "
        );
        
        if (query != null && !query.trim().isEmpty()) {
            sql.append("AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?) ");
        }
        if (categoryId != null && categoryId > 0) {
            sql.append("AND p.category_id = ? ");
        }

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            int paramIndex = 1;
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim() + "%";
                ps.setString(paramIndex++, pattern);
                ps.setString(paramIndex++, pattern);
                ps.setString(paramIndex++, pattern);
            }
            if (categoryId != null && categoryId > 0) {
                ps.setInt(paramIndex++, categoryId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToProduct(rs));
                }
            }
        }
        return list;
    }

    public boolean insertProduct(Product p) throws SQLException {
        String sql = "INSERT INTO products (sku, barcode, name, category_id, cost_price, selling_price, stock_quantity, min_stock_alert, unit, supplier, description) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getSku());
            ps.setString(2, p.getBarcode());
            ps.setString(3, p.getName());
            ps.setInt(4, p.getCategoryId());
            ps.setDouble(5, p.getCostPrice());
            ps.setDouble(6, p.getSellingPrice());
            ps.setInt(7, p.getStockQuantity());
            ps.setInt(8, p.getMinStockAlert());
            ps.setString(9, p.getUnit());
            ps.setString(10, p.getSupplier());
            ps.setString(11, p.getDescription());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updateProduct(Product p) throws SQLException {
        String sql = "UPDATE products SET sku=?, barcode=?, name=?, category_id=?, cost_price=?, selling_price=?, " +
                     "stock_quantity=?, min_stock_alert=?, unit=?, supplier=?, description=? WHERE id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getSku());
            ps.setString(2, p.getBarcode());
            ps.setString(3, p.getName());
            ps.setInt(4, p.getCategoryId());
            ps.setDouble(5, p.getCostPrice());
            ps.setDouble(6, p.getSellingPrice());
            ps.setInt(7, p.getStockQuantity());
            ps.setInt(8, p.getMinStockAlert());
            ps.setString(9, p.getUnit());
            ps.setString(10, p.getSupplier());
            ps.setString(11, p.getDescription());
            ps.setInt(12, p.getId());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteProduct(int id) throws SQLException {
        String sql = "DELETE FROM products WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    private Product mapResultSetToProduct(ResultSet rs) throws SQLException {
        Product p = new Product();
        p.setId(rs.getInt("id"));
        p.setSku(rs.getString("sku"));
        p.setBarcode(rs.getString("barcode"));
        p.setName(rs.getString("name"));
        p.setCategoryId(rs.getInt("category_id"));
        p.setCategoryName(rs.getString("category_name"));
        p.setCostPrice(rs.getDouble("cost_price"));
        p.setSellingPrice(rs.getDouble("selling_price"));
        p.setStockQuantity(rs.getInt("stock_quantity"));
        p.setMinStockAlert(rs.getInt("min_stock_alert"));
        p.setUnit(rs.getString("unit"));
        p.setSupplier(rs.getString("supplier"));
        p.setDescription(rs.getString("description"));
        return p;
    }
}
`,
  },
  {
    name: 'SalesServlet.java',
    path: 'src/main/java/com/company/pos/servlet/SalesServlet.java',
    language: 'java',
    description: 'Transaction-safe POS checkout controller with atomic stock deduction and invoice generation',
    code: `package com.company.pos.servlet;

import com.company.pos.config.DBConnection;
import com.company.pos.model.User;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@WebServlet("/sales")
public class SalesServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("currentUser") == null) {
            response.sendRedirect(request.getContextPath() + "/login.jsp");
            return;
        }

        User user = (User) session.getAttribute("currentUser");
        String action = request.getParameter("action");

        if ("checkout".equals(action)) {
            processCheckout(request, response, user);
        }
    }

    private void processCheckout(HttpServletRequest req, HttpServletResponse resp, User cashier) 
            throws IOException {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Atomic Transaction Start

            String customerIdStr = req.getParameter("customerId");
            Integer customerId = (customerIdStr != null && !customerIdStr.isEmpty()) ? Integer.parseInt(customerIdStr) : null;
            double subtotal = Double.parseDouble(req.getParameter("subtotal"));
            double taxAmount = Double.parseDouble(req.getParameter("taxAmount"));
            double discountAmount = Double.parseDouble(req.getParameter("discountAmount"));
            double totalAmount = Double.parseDouble(req.getParameter("totalAmount"));
            String paymentMethod = req.getParameter("paymentMethod");
            double amountReceived = Double.parseDouble(req.getParameter("amountReceived"));
            double changeGiven = Math.max(0, amountReceived - totalAmount);

            // Generate unique invoice number: INV-YEAR-TIMESTAMP
            String invoiceNumber = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));

            // 1. Insert Sales Record
            String insertSaleSql = "INSERT INTO sales (invoice_number, customer_id, cashier_id, subtotal, tax_amount, discount_amount, " +
                                   "total_amount, payment_method, amount_received, change_given, payment_status) " +
                                   "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID')";
            
            int saleId;
            try (PreparedStatement ps = conn.prepareStatement(insertSaleSql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, invoiceNumber);
                if (customerId != null) ps.setInt(2, customerId); else ps.setNull(2, Types.INTEGER);
                ps.setInt(3, cashier.getId());
                ps.setDouble(4, subtotal);
                ps.setDouble(5, taxAmount);
                ps.setDouble(6, discountAmount);
                ps.setDouble(7, totalAmount);
                ps.setString(8, paymentMethod);
                ps.setDouble(9, amountReceived);
                ps.setDouble(10, changeGiven);
                ps.executeUpdate();

                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) saleId = keys.getInt(1);
                    else throw new SQLException("Creating sale failed, no ID obtained.");
                }
            }

            // 2. Insert items and decrement product stock
            String[] productIds = req.getParameterValues("productId[]");
            String[] quantities = req.getParameterValues("quantity[]");
            String[] unitPrices = req.getParameterValues("unitPrice[]");
            String[] costPrices = req.getParameterValues("costPrice[]");

            String insertItemSql = "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, total) VALUES (?, ?, ?, ?, ?, ?)";
            String updateStockSql = "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?";
            String logStockSql = "INSERT INTO stock_logs (product_id, type, quantity_change, previous_stock, new_stock, reason, user_id) " +
                                 "VALUES (?, 'SALE', ?, (SELECT stock_quantity + ? FROM products WHERE id=?), (SELECT stock_quantity FROM products WHERE id=?), ?, ?)";

            try (PreparedStatement psItem = conn.prepareStatement(insertItemSql);
                 PreparedStatement psStock = conn.prepareStatement(updateStockSql)) {
                
                for (int i = 0; i < productIds.length; i++) {
                    int pId = Integer.parseInt(productIds[i]);
                    int qty = Integer.parseInt(quantities[i]);
                    double price = Double.parseDouble(unitPrices[i]);
                    double cost = Double.parseDouble(costPrices[i]);
                    double itemTotal = qty * price;

                    // Add to sale_items
                    psItem.setInt(1, saleId);
                    psItem.setInt(2, pId);
                    psItem.setInt(3, qty);
                    psItem.setDouble(4, price);
                    psItem.setDouble(5, cost);
                    psItem.setDouble(6, itemTotal);
                    psItem.executeUpdate();

                    // Decrement stock
                    psStock.setInt(1, qty);
                    psStock.setInt(2, pId);
                    psStock.setInt(3, qty); // Ensure stock doesn't go below 0
                    int affected = psStock.executeUpdate();
                    if (affected == 0) {
                        throw new SQLException("Insufficient stock available for Product ID: " + pId);
                    }
                }
            }

            // Commit transaction
            conn.commit();
            resp.sendRedirect(req.getContextPath() + "/invoice.jsp?id=" + saleId + "&success=true");

        } catch (Exception e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException rollbackEx) { rollbackEx.printStackTrace(); }
            }
            e.printStackTrace();
            resp.sendRedirect(req.getContextPath() + "/pos.jsp?error=" + e.getMessage());
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); } catch (SQLException ex) {}
            }
        }
    }
}
`,
  },
  {
    name: 'AuthFilter.java',
    path: 'src/main/java/com/company/pos/filter/AuthFilter.java',
    language: 'java',
    description: 'Role-Based Access Control (RBAC) servlet filter guarding admin and manager routes',
    code: `package com.company.pos.filter;

import com.company.pos.model.User;
import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

@WebFilter("/*")
public class AuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        String uri = req.getRequestURI();
        String contextPath = req.getContextPath();

        // Allow static assets and login endpoints
        if (uri.endsWith("login.jsp") || uri.endsWith("/auth") || uri.contains("/css/") || uri.contains("/js/")) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = req.getSession(false);
        User user = (session != null) ? (User) session.getAttribute("currentUser") : null;

        if (user == null) {
            resp.sendRedirect(contextPath + "/login.jsp");
            return;
        }

        // RBAC Authorization enforcement:
        // Cashiers cannot access user management, reports, or stock deletion
        if (uri.contains("/users") || uri.contains("/reports")) {
            if (!"ADMIN".equals(user.getRole())) {
                resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied: Administrator role required.");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
`,
  },
  {
    name: 'web.xml',
    path: 'src/main/webapp/WEB-INF/web.xml',
    language: 'xml',
    description: 'Apache Tomcat standard deployment descriptor with session timeout and welcome file',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
                             http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <display-name>POS and Inventory Management System</display-name>

    <welcome-file-list>
        <welcome-file>login.jsp</welcome-file>
        <welcome-file>dashboard.jsp</welcome-file>
    </welcome-file-list>

    <!-- Session Expiration Configuration (30 mins) -->
    <session-config>
        <session-timeout>30</session-timeout>
        <cookie-config>
            <http-only>true</http-only>
            <secure>false</secure>
        </cookie-config>
    </session-config>

    <!-- Error Pages -->
    <error-page>
        <error-code>404</error-code>
        <location>/error404.jsp</location>
    </error-page>
    <error-page>
        <error-code>403</error-code>
        <location>/error403.jsp</location>
    </error-page>
</web-app>
`,
  },
  {
    name: 'pom.xml',
    path: 'pom.xml',
    language: 'xml',
    description: 'IntelliJ IDEA Maven build file with MySQL Connector, Servlet 4.0, JSTL and BCrypt',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.company.pos</groupId>
    <artifactId>pos-inventory-system</artifactId>
    <version>1.0.0</version>
    <packaging>war</packaging>

    <name>POS and Inventory Management System</name>

    <properties>
        <maven.compiler.release>25</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Java Servlet API for Apache Tomcat -->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
            <scope>provided</scope>
        </dependency>

        <!-- JavaServer Pages (JSP) API -->
        <dependency>
            <groupId>javax.servlet.jsp</groupId>
            <artifactId>javax.servlet.jsp-api</artifactId>
            <version>2.3.3</version>
            <scope>provided</scope>
        </dependency>

        <!-- JSTL Standard Tag Library -->
        <dependency>
            <groupId>jstl</groupId>
            <artifactId>jstl</artifactId>
            <version>1.2</version>
        </dependency>

        <!-- MySQL Connector / J (JDBC Driver) -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>8.3.0</version>
        </dependency>

        <!-- Gson for Ajax JSON endpoints -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>

        <!-- BCrypt Password Hashing -->
        <dependency>
            <groupId>org.mindrot</groupId>
            <artifactId>jbcrypt</artifactId>
            <version>0.4</version>
        </dependency>
    </dependencies>

    <build>
        <finalName>pos-system</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.1</version>
            </plugin>
                <artifactId>maven-war-plugin</artifactId>
                <version>3.3.2</version>
            </plugin>
        </plugins>
    </build>
</project>
`,
  },
];
