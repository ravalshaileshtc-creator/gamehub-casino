import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma

/**
 * Fast DB Query wrapper:
 * Prevents 30-second Prisma MongoDB connection timeouts when local MongoDB server is offline.
 * Automatically falls back to fallbackValue after timeoutMs (default 250ms).
 */
export async function fastDbQuery<T>(
  dbOperation: () => Promise<T>, 
  fallbackValue: T, 
  timeoutMs = 250
): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs)
  })

  try {
    const result = await Promise.race([
      dbOperation().then((res) => {
        clearTimeout(timer)
        return res
      }), 
      timeoutPromise
    ])
    return result
  } catch (error) {
    clearTimeout(timer!)
    return fallbackValue
  }
}
