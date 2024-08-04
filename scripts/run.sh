#!/bin/sh

npm run prisma:migrate

node dist/main.js
