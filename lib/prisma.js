// const { PrismaClient } = require("../lib/generated/prisma");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = prisma;
