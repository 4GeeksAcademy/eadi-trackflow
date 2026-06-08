import { Producto } from "../types/models.ts";

export function calcularValorInventario(
  productos: Producto[]
): number {

  return productos.reduce(
    (total: number, producto: Producto): number =>
      total + (producto.precio * producto.cantidadStock),
    0
  );
}

export function contarProductosPorCategoria(
  productos: Producto[],
  categoria: string
): number {

  return productos.filter(
    (producto: Producto): boolean =>
      producto.categoria === categoria
  ).length;
}

export function obtenerProductoMasCaro(
  productos: Producto[]
): Producto | undefined {

  if (productos.length === 0) {
    return undefined;
  }

  return productos.reduce(
    (maximo: Producto, actual: Producto): Producto =>
      actual.precio > maximo.precio ? actual : maximo
  );
}

export function calcularStockPromedio(
  productos: Producto[]
): number {

  if (productos.length === 0) {
    return 0;
  }

  const stockTotal: number = productos.reduce(
    (acumulador: number, producto: Producto): number =>
      acumulador + producto.cantidadStock,
    0
  );

  return stockTotal / productos.length;
}

import {
  ZonaEnvio
} from "../types/models";

function calcularPesoVolumetrico(
  producto: Producto
): number {

  const volumenCm =
    producto.anchoCm *
    producto.altoCm *
    producto.profundidadCm;

  return volumenCm / 5000;
}

export function calcularCostoEnvio(
  producto: Producto,
  zona: ZonaEnvio
): number {

  const pesoReal: number =
    producto.pesoKg;

  const pesoVolumetrico: number =
    calcularPesoVolumetrico(producto);

  const pesoFacturable: number =
    Math.max(pesoReal, pesoVolumetrico);

  let tarifaBase: number;

switch (zona) {

  case "Zona A":
    tarifaBase = 5;
    break;

  case "Zona B":
    tarifaBase = 10;
    break;

  case "Zona C":
    tarifaBase = 20;
    break;
}

  return Number(
    (
      tarifaBase +
      pesoFacturable * 2.5
    ).toFixed(2)
  );
}

function calcularVolumenM3(
  producto: Producto
): number {

  const volumenCm3 =
    producto.anchoCm *
    producto.altoCm *
    producto.profundidadCm;

  return volumenCm3 / 1000000;
}

export function calcularCostoAlmacenamiento(
  producto: Producto,
  diasAlmacenado: number
): number {

  const volumenM3: number =
    calcularVolumenM3(producto);

  const tarifaDiariaPorM3: number = 1.8;

  let costoTotal: number =
    volumenM3 *
    tarifaDiariaPorM3 *
    diasAlmacenado;

  if (diasAlmacenado > 30) {
    costoTotal *= 1.15;
  }

  if (diasAlmacenado > 90) {
    costoTotal *= 1.25;
  }

  return Number(costoTotal.toFixed(2));
}