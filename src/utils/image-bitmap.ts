import { Image } from '../rom-parser/sprites/types';

export const convertToImageBitmap = async (
  image: Image,
): Promise<ImageBitmap> => {
  const size = image.width * image.height * 4;
  const data = new Uint8ClampedArray(size);

  let index = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const color = image.get(x, y);

      if (color) {
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 0xff;
      }

      index += 4;
    }
  }

  const imageData = new ImageData(data, image.width, image.height);
  return createImageBitmap(imageData);
};
