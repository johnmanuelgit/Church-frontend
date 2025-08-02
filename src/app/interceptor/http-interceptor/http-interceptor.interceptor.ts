import { HttpInterceptorFn } from '@angular/common/http';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const backendUrl = 'https://church-backend-production.up.railway.app';

  if (req.url.startsWith('http')) {
    return next(req);
  }

  const modifiedReq = req.clone({
    url: `${backendUrl}/${req.url}`,
  });

  return next(modifiedReq);
};
