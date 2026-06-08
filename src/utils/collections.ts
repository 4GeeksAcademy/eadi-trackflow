import {
  Producto,
  CategoriaProducto,
  UbicacionAlmacen,
  Transportista
} from "../types/models.ts";

export function filtrarProductosPorAlmacen(
  productos: Producto[],
  almacen: UbicacionAlmacen
): Producto[] {
  return productos.filter(
    (producto: Producto): boolean =>
      producto.almacen === almacen
  );
}

export function filtrarProductosPorCategoria(
  productos: Producto[],
  categoria: CategoriaProducto
): Producto[] {
  return productos.filter(
    (producto: Producto): boolean =>
      producto.categoria === categoria
  );
}

export function filtrarProductosConStockBajo(
  productos: Producto[]
): Producto[] {
  return productos.filter(
    (producto: Producto): boolean =>
      producto.cantidadStock <= producto.umbralMinimoStock
  );
}

export function ordenarProductosPorStock(
  productos: Producto[],
  orden: "asc" | "desc"
): Producto[] {

  const productosCopiados: Producto[] = [...productos];

  return productosCopiados.sort((a: Producto, b: Producto): number => {
    return orden === "asc"
      ? a.cantidadStock - b.cantidadStock
      : b.cantidadStock - a.cantidadStock;
  });
}

export function ordenarTransportistasPorConfiabilidad(
  transportistas: Transportista[],
  orden: "asc" | "desc"
): Transportista[] {

  const transportistasCopiados: Transportista[] = [...transportistas];

  return transportistasCopiados.sort((a: Transportista, b: Transportista): number => {
    return orden === "asc"
      ? a.porcentajeEntregasATiempo - b.porcentajeEntregasATiempo
      : b.porcentajeEntregasATiempo - a.porcentajeEntregasATiempo;
  });
}
