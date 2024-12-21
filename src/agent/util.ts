export async function stdOutWriteSync(buffer: Uint8Array | string) {
  const promise = new Promise((resolve, rejects) => {
    const cb: (err?: Error) => void = (err) => {
      if (err) {
        console.error(err.message);
        return rejects(err);
      }
      return resolve("");
    };
    return process.stdout.write(buffer, cb);
  });
  return await promise;
}
