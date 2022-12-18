import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';

// NOTE: taken from https://github.com/Stuk/jszip/issues/386#issuecomment-1283099454

// assume filePaths are validated
export function zip(cwd: string, filePaths: string[]): NodeJS.ReadableStream {
  const zip = new JSZip();
  for (const filePath of filePaths) {
    // create folder trees manually
    const dirName = path.dirname(path.relative(cwd, filePath));
    const dirNames = dirName === '.' ? [] : dirName.split(path.sep);
    const zipFolder = dirNames.reduce(
      (zipFolder, dirName) => zipFolder.folder(dirName) || zip,
      zip
    );
    zipFolder.file(path.basename(filePath), fs.createReadStream(filePath));
  }
  return zip.generateNodeStream({
    streamFiles: true,
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}
