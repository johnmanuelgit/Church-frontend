import { HttpInterceptorFn } from '@angular/common/http';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const backendUrl = 'http://localhost:3000';

  if (req.url.startsWith('http')) {
    return next(req);
  }

  const modifiedReq = req.clone({
    url: `${backendUrl}/${req.url}`,
  });

  return next(modifiedReq);
};
