import sys
import re

# Read the file
with open(r'F:\Mike d drive\Mike Webs\Client Projects\Amate and Changa\La Cueva del Chango\cueva-pwa\api\index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove BOM if present
if content.startswith('\ufeff'):
    content = content[1:]

# Fix the first line - split imports properly
old_first = 'import express from "express";import { teable, TEABLE_TABLES } from \'../teable\';import dotenv from \'dotenv\';import crypto from \'crypto\';import { GoogleGenAI } from "@google/genai";import { parseISO, addHours, isBefore, getDay } from \'date-fns\';const MAX_GUESTS = 100;'
new_first = '''import express from "express";
import { teable, TEABLE_TABLES } from '../teable';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from "@google/genai";
import { parseISO, addHours, isBefore, getDay } from 'date-fns';
const MAX_GUESTS = 100;'''

content = content.replace(old_first, new_first)

# Write back
with open(r'F:\Mike d drive\Mike Webs\Client Projects\Amate and Changa\La Cueva del Chango\cueva-pwa\api\index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed imports')