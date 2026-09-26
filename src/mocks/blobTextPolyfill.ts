const readBlobAsText = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

export const installBlobTextPolyfill = () => {
  if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
    Blob.prototype.text = function text(this: Blob) {
      return readBlobAsText(this);
    };
  }
};
