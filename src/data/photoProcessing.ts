export type PhotoTreatment = 'black-and-white' | 'six-color'

export function processPhotoPixels(
  data: Uint8ClampedArray,
  treatment: PhotoTreatment,
  brightness: number,
  contrast: number,
): void {
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  for (let index = 0; index < data.length; index += 4) {
    let red = Math.max(0, Math.min(255, contrastFactor * (data[index] - 128) + 128 + brightness))
    let green = Math.max(0, Math.min(255, contrastFactor * (data[index + 1] - 128) + 128 + brightness))
    let blue = Math.max(0, Math.min(255, contrastFactor * (data[index + 2] - 128) + 128 + brightness))

    if (treatment === 'black-and-white') {
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114
      red = luminance
      green = luminance
      blue = luminance
    }

    data[index] = red
    data[index + 1] = green
    data[index + 2] = blue
  }
}
