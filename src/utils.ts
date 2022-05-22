// generic functions

const uuid = (): string => {
  return String(Math.floor(Math.random() * 1e9));
};

const isNumeric = (s: string | number): boolean => {
  if (Number.isFinite(s)) {
    return true;
  }

  if (typeof s !== 'string') {
    return false;
  }

  return !isNaN(s as any) && !isNaN(parseFloat(s));
};

export { uuid, isNumeric };
