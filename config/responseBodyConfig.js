function responseBodyFormat() {
  function errorFormat(data) {
    const errorBaseFormat = {
      message: data
    };

    if (typeof data !== 'string') {
      return data;
    }

    return errorBaseFormat;
  }

  function successFormat(data) {
    const generalSuccessBaseFormat = {
      message: data
    };

    if (typeof data !== 'string') {
      return data;
    }

    return generalSuccessBaseFormat;
  }

  return {
    errorFormat,
    successFormat
  };
}

module.exports = responseBodyFormat;
