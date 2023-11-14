import isEqual from 'lodash.isequal'
import { HttpResponse, ResponseResolver } from 'msw'

// This is a typed version of the withJsonBody() example from the
// document with the fix https://github.com/mswjs/mswjs.io/pull/317
//
// We get a type error in the return statement. The reason is that
// `resolver(args)` in the last line may return a `Generator<...>` due to the
// current types. Inside an async function the overall return type becomes
// `Promise<Generator<...>>` which does not fit the current type definition
// of a resolver (which is `R | Promise<A> | Generator<R | Promise<R>>).
export function withJsonBodyAsInExamples(
  expectedBody: unknown,
  resolver: ResponseResolver,
): ResponseResolver {
  return async (args) => {
    const { request } = args

    // Ignore requests that have a non-JSON body.
    const contentType = request.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      return
    }

    // Clone the request and read it as JSON.
    const actualBody = await request.clone().json()

    // Compare two objects using "lodash".
    if (!isEqual(actualBody, expectedBody)) {
      return
    }

    return resolver(args)
  }
}

// This is a fixed version of the example. The `as` statement in the end
// strips away the `Generator<..>` type in the return type. So that the rest
// fits the type definition.
export function withJsonBodyFixedWithAsStatement(
  expectedBody: unknown,
  resolver: ResponseResolver,
): ResponseResolver {
  return async (args) => {
    const { request } = args

    // Ignore requests that have a non-JSON body.
    const contentType = request.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      return
    }

    // Clone the request and read it as JSON.
    const actualBody = await request.clone().json()

    // Compare two objects using "lodash".
    if (!isEqual(actualBody, expectedBody)) {
      return
    }

    return resolver(args) as HttpResponse | undefined | void
  }
}

// Another example to fix the type error by unpacking the generator object in
// case it is returned
export function withJsonBodyFixedWithUnpackingGenerator(
  expectedBody: unknown,
  resolver: ResponseResolver,
): ResponseResolver {
  return async (args) => {
    const { request } = args

    // Ignore requests that have a non-JSON body.
    const contentType = request.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      return
    }

    // Clone the request and read it as JSON.
    const actualBody = await request.clone().json()

    // Compare two objects using "lodash".
    if (!isEqual(actualBody, expectedBody)) {
      return
    }

    const result = resolver(args)

    if (isGenerator(result)) {
      const { done, value } = result.next()

      if (!done) return value
    } else {
      return await result
    }
  }
}

declare function isGenerator(x: unknown): x is Generator
