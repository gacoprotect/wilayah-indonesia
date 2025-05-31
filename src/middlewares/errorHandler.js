

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  const response = {
    success: false,
    message,
    status
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
    if (err.filePath) {
      response.filePath = err.filePath;
    }
  }

  console.error(`[${new Date().toISOString()}] Error: ${message}`, {
    status,
    path: req.path,
    ...(err.filePath && { filePath: err.filePath })
  });

  res.status(status).json(response);
};

export default errorHandler;