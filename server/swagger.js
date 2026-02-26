/**
 * OpenAPI (Swagger) spec for Ledger API
 */
const PORT = process.env.PORT || 3001

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Ledger P&L API',
    version: '1.0.0',
    description: 'API for kirana shop ledger and P&L tracking.',
  },
  servers: [{ url: `http://localhost:${PORT}`, description: 'Local' }],
  paths: {
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Sign up',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                  name: { type: 'string', example: 'John' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error or email already registered' },
          500: { description: 'Server error' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Email and password required' },
          401: { description: 'Invalid email or password' },
          500: { description: 'Server error' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK - If account exists, reset link sent (or returned when SMTP not configured)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    message: { type: 'string' },
                    resetToken: { type: 'string', description: 'Dev only when SMTP not configured' },
                  },
                },
              },
            },
          },
          500: { description: 'Server error' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          400: { description: 'Invalid or expired token' },
          500: { description: 'Server error' },
        },
      },
    },
    '/api/auth/me': {
      patch: {
        tags: ['Auth'],
        summary: 'Update profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  avatar_url: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } },
          401: { description: 'Unauthorized' },
          500: { description: 'Server error' },
        },
      },
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'User not found' },
          500: { description: 'Server error' },
        },
      },
    },
    '/api/ledger': {
      get: {
        tags: ['Ledger'],
        summary: 'Get ledger data',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accounts: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Cash', 'Customer A', 'Supplier B'],
                    },
                    entries: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LedgerEntry' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          500: { description: 'Server error' },
        },
      },
      put: {
        tags: ['Ledger'],
        summary: 'Update ledger data',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  accounts: {
                    type: 'array',
                    items: { type: 'string' },
                    default: [],
                  },
                  entries: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LedgerEntry' },
                    default: [],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean' } },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          500: { description: 'Server error' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from login/signup',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          avatar_url: { type: 'string', format: 'uri', description: 'Profile image URL' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      LedgerEntry: {
        type: 'object',
        description: 'Single ledger entry',
        properties: {
          id: { type: 'string' },
          date: { type: 'string', format: 'date' },
          account: { type: 'string' },
          debit: { type: 'number', description: 'Debit amount' },
          credit: { type: 'number', description: 'Credit amount' },
          note: { type: 'string' },
        },
      },
    },
  },
}
