 Database Skill

Description: Create tables, manage migrations, and design scalable schemas.

Core Concepts
Database fundamentals

Relational vs Non-relational databases

Primary keys & foreign keys

Normalization & denormalization

Schema design

Entity Relationship Modeling (ERD)

Data types & constraints

Indexing strategy

Migrations

Version-controlled schema changes

Rollbacks & forward migrations

Environment-based migrations

Operations
Table management

Create, alter, and drop tables

Add / remove columns

Define constraints (UNIQUE, NOT NULL, CHECK)

Relationships

One-to-one

One-to-many

Many-to-many (junction tables)

Query basics

CRUD operations

Joins (INNER, LEFT, RIGHT)

Aggregations (COUNT, SUM, GROUP BY)

Tooling & Technologies

SQL (PostgreSQL, MySQL)

ORM tools (Prisma, Sequelize, TypeORM)

Migration tools (Prisma Migrate, Flyway)

Database GUIs (pgAdmin, MySQL Workbench)

Best Practices

Use meaningful table and column names

Keep schemas normalized by default

Always use migrations (avoid manual production edits)

Index columns used in joins and filters

Avoid storing redundant data

Backup before major schema changes

Example Structure
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 






