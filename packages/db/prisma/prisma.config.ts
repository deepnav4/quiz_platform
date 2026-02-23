// Prisma 7 Configuration
// Database connection URL configuration

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
