/** Hands a file to the browser's download (v1 `FileSaver.saveAs`). Call it from an event handler. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // The click has started the download; the URL is no longer needed once it has read the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
