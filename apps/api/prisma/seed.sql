-- Seed script for realestate_crm
-- Run via: docker exec -i realestate-postgres psql -U postgres -d realestate_crm < prisma/seed.sql

-- Default Company
INSERT INTO companies (id, name, slug, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Default Company', 'default-company', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'default-company');

-- Admin User (update clerkId for real Clerk users)
INSERT INTO users (id, email, "companyId", "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'admin@realestate.com', c.id, 'Admin', 'User', 'ADMIN', true, NOW(), NOW()
FROM companies c WHERE c.slug = 'default-company'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@realestate.com');

-- Departments (clean insert)
INSERT INTO departments (id, name, "companyId", description, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, c.id, v.dsc, NOW(), NOW()
FROM companies c
CROSS JOIN (VALUES ('Sales', 'Property sales team'), ('Marketing', 'Marketing and lead generation'), ('Human Resources', 'HR and administration'), ('Operations', 'Property operations and management')) AS v(name, dsc)
WHERE c.slug = 'default-company';

-- Designations (clean insert)
INSERT INTO designations (id, name, "departmentId", "companyId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, d.id, d."companyId", NOW(), NOW()
FROM departments d
CROSS JOIN (VALUES ('Sales', 'Sales Manager'), ('Sales', 'Sales Executive'), ('Human Resources', 'HR Manager'), ('Operations', 'Operations Manager')) AS v(deptName, name)
WHERE d.name = v.deptName;
