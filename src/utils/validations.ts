import { Producto, Transportista } from "../types/models.ts";

export function validarProducto(
  producto: Producto
): boolean {

  const tieneNombreValido: boolean =
    producto.nombre.trim().length > 0;

  const tienePrecioValido: boolean =
    producto.precio > 0;

  const tieneStockValido: boolean =
    producto.cantidadStock >= 0;

  return (
    tieneNombreValido &&
    tienePrecioValido &&
    tieneStockValido
  );
}

export function validarTransportista(
  transportista: Transportista
): boolean {

  const tasaValida: boolean =
    transportista.porcentajeEntregasATiempo >= 0 &&
    transportista.porcentajeEntregasATiempo <= 100;

  const enviosValidos: boolean =
    transportista.enviosActivos >= 0;

  return tasaValida && enviosValidos;
}

export function validarDimensionesPaquete(
  producto: Producto
): boolean {

  return (
    producto.anchoCm > 0 &&
    producto.altoCm > 0 &&
    producto.profundidadCm > 0
  );
}

export function validarPeso(
  producto: Producto
): boolean {

  return (
    producto.pesoKg > 0 &&
    producto.pesoKg <= 1000
  );
}