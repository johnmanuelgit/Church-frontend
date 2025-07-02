import { HttpInterceptorFn } from '@angular/common/http';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {

  const backendUrl = 'https://church-backend-036s.onrender.com';

  if (req.url.startsWith('http')) {
    return next(req);
  }

  const modifiedReq = req.clone({
    url: `${backendUrl}/${req.url}`
  });

  return next(modifiedReq);
};
