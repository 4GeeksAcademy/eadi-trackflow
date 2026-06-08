import { Producto } from "../types/models.ts";

export function busquedaLinealProductoPorId(
  productos: Producto[],
  id: string
): Producto | undefined {

  for (const producto of productos) {
    if (producto.id === id) {
      return producto;
    }
  }

  return undefined;
}

export function busquedaBinariaProductoPorId(
  productos: Producto[],
  idObjetivo: string
): Producto | undefined {

  let izquierda: number = 0;
  let derecha: number = productos.length - 1;

  while (izquierda <= derecha) {

    const medio: number =
      Math.floor((izquierda + derecha) / 2);

    const productoActual: Producto = productos[medio];

    if (productoActual.id === idObjetivo) {
      return productoActual;
    }

    if (productoActual.id < idObjetivo) {
      izquierda = medio + 1;
    } else {
      derecha = medio - 1;
    }
  }

  return undefined;
}