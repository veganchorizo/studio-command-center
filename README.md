# Studio Command Center

Prompt: Build "The Studio OS" — An Offline AI Operating System for Recording Studios

You are an expert senior software architect, UX designer, DevOps engineer, and TypeScript full-stack developer.

Your task is to build a complete production-ready application called The Studio OS.

Core Philosophy

This application is not another ChatGPT wrapper.

It is an operating system for a professional recording studio.

Everything runs 100% locally inside Docker.

There are NO cloud services, NO telemetry, NO analytics, NO API calls to external services, and NO vendor lock-in.

The application should function even with the internet disconnected.

The only network traffic permitted is to services running inside the Docker Compose stack.

The entire application should be self-hostable.

Technology Stack

Use modern technologies.

Frontend

React

TypeScript

Vite

TailwindCSS

shadcn/ui

TanStack Query

Zustand

React Router

Backend

Fastify

TypeScript

Prisma

PostgreSQL

pgvector

AI

Ollama

llama.cpp compatible

Support any GGUF model

Embedding model

RAG pipeline

Local inference only

Search

Hybrid search

pgvector similarity

Full text search

Storage

PostgreSQL

Local filesystem

Docker volumes

Containerization

Docker Compose

Multi-stage Dockerfiles

No Kubernetes

No cloud deployment assumptions

Containers

The stack should consist of:

studio-os-web

studio-os-api

studio-os-db

studio-os-ollama

studio-os-worker

studio-os-ingest

studio-os-backups

Optional

studio-os-nginx

Everything communicates over an internal Docker network.

Nothing should require internet access after installation.

Authentication

Simple local authentication.

username/password

session cookies

bcrypt

local admin account

No OAuth.

No Google.

No Microsoft.

No Auth0.

Dashboard

The home page should feel like a studio command center.

Widgets include

Today's sessions

Upcoming sessions

Maintenance reminders

Recent AI conversations

Studio tasks

Unread notes

Equipment needing service

Open invoices

Recent documentation

Knowledge graph activity

Global search

Everything is customizable.

Left Sidebar

Dashboard

Sessions

Artists

Projects

Equipment

Maintenance

Patchbay

Inventory

Clients

Tasks

Calendar

Knowledge Base

AI Assistant

Marketing

Finance

Intern Training

Settings

AI Assistant

This is the centerpiece.

Think of it as a Chief Engineer.

It understands:

Equipment

Studio layout

Signal flow

Patchbay

Microphones

Clients

Artists

Projects

Maintenance

Past sessions

Mix notes

Manuals

Invoices

Studio documentation

Policies

Training documentation

It always cites where it found information.

It should support:

Conversation history

Pinned conversations

Multiple workspaces

Markdown

Code blocks

Tables

Images later

Streaming responses

Local RAG

Knowledge Base

The application should ingest:

PDF

Word

Markdown

Text

CSV

JSON

XML

Images with OCR

Equipment manuals

Patch sheets

Studio policies

Signal flow documentation

Artist notes

Mix notes

Invoices

Receipts

Calendars

Emails exported as mbox

Everything becomes searchable.

Automatic chunking.

Automatic embeddings.

Automatic metadata extraction.

Session Management

Each recording session contains:

Artist

Engineer

Assistant

Date

Studio room

Project

Songs

Microphones used

Outboard

Patching

Cue mixes

Photos

Session notes

Problems encountered

Mix revisions

Deliverables

Invoices

Files

Every session becomes searchable by AI.

Equipment Database

Store every piece of equipment.

Fields

Manufacturer

Model

Serial

Purchase date

Warranty

Location

Rack

Maintenance history

Photos

Manual

Notes

Signal chain compatibility

Favorite uses

Known issues

Calibration history

Related sessions

Patchbay Manager

Interactive patchbay.

Visual representation.

Save routing presets.

Compare changes.

Print labels.

Track normalled connections.

Track cable faults.

Maintenance Module

Track

Tube replacement

Calibration

Cleaning

Firmware

Repairs

Consumables

Generate reminders.

AI predicts future maintenance.

Inventory

Track

Cables

Adapters

Strings

Drum heads

Batteries

Gaff tape

Hard drives

Microphones

Cases

Automatically warn when inventory is low.

Client CRM

Clients contain

Contact info

Projects

Invoices

Preferences

Favorite microphones

Coffee preference

Past communication

Session history

Deliverables

Tags

Marketing Workspace

Generate

Instagram posts

Facebook posts

Threads

LinkedIn

Website articles

Newsletter

SEO articles

Email campaigns

Press releases

Studio announcements

Everything is editable.

Nothing is automatically posted.

Finance

Track

Invoices

Payments

Outstanding balances

Expenses

Profit by project

Profit by artist

Monthly reports

Equipment ROI

No accounting integrations.

CSV import/export only.

Calendar

Local calendar.

Sessions

Maintenance

Deadlines

Invoices

Tour dates

Tasks

Drag and drop.

Task Manager

Kanban

Calendar

Priority

Due dates

Assignments

Recurring tasks

Templates

Intern Training

Lessons

Quizzes

Equipment walkthroughs

Signal flow exercises

Patchbay exercises

Daily checklists

Progress tracking

Search

One global search.

Searches everything.

Documents

Sessions

Clients

Equipment

Manuals

Notes

Conversations

Projects

Tasks

Returns semantic and keyword matches.

Document Ingestion Pipeline

Watch folders.

Automatically ingest new files.

Extract metadata.

Generate embeddings.

Store originals.

Version documents.

Never overwrite originals.

AI Agent System

Create specialized agents.

Chief Engineer

Signal flow

Troubleshooting

Recording advice

Studio Manager

Scheduling

Client communication

Tasks

Marketing Director

Content generation

Business Analyst

Revenue

Trends

Archivist

Knowledge retrieval

Maintenance Manager

Equipment health

Intern Trainer

Education

Agents share the same knowledge base.

Settings

Configure

LLM model

Embedding model

Chunk size

Vector dimensions

GPU usage

CPU threads

Watch folders

Backup schedule

Theme

Database backups

Design Language

Dark mode by default.

Inspired by

Professional DAWs

Mission Control

Large recording consoles

Minimal distractions

Keyboard-first workflow

Fast navigation

Responsive

Accessible

Performance

The application should comfortably manage:

100,000 documents

20 years of sessions

Thousands of artists

Millions of embeddings

Sub-second search

Background indexing

Streaming AI responses

Docker Requirements

Provide:

docker-compose.yml

Dockerfiles

Development mode

Production mode

Named volumes

Health checks

Automatic migrations

Environment variables

Persistent storage

Offline installation documentation

One-command startup:

docker compose up -d

Security

No telemetry.

No external requests.

Content Security Policy.

Encrypted passwords.

Role-based permissions.

Audit log.

Automatic backups.

Local file permissions.

Future Plugin Architecture

Design the application around a plugin system.

Plugins can add:

Views

Agents

Sidebar modules

Importers

Exporters

Commands

Automations

Every plugin should run locally.

Code Quality

Use:

Strict TypeScript

Feature-based architecture

Dependency injection where appropriate

Reusable components

Unit tests

Integration tests

End-to-end tests

Typed API contracts

Comprehensive documentation

Deliverables

Generate the complete application with production-quality architecture, not a prototype.

Prioritize maintainability, modularity, extensibility, and offline reliability.

When uncertain, favor local-first, privacy-first, and performance-first design decisions.

The finished product should feel like a professional operating system purpose-built for recording studios rather than a generic AI chat application.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d0931b52-0e9a-47ca-8877-33c573501c26).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
