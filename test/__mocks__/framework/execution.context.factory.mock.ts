export function executionContextFactory(
  headers: Record<string, string | undefined>,
  user: any = { id: '123', role: 'ADMIN' },
) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, user }),
    }),
  } as any;
}
