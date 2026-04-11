declare module "react-simple-maps" {
  import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react"

  export interface ZoomableGroupPosition {
    coordinates: [number, number]
    zoom: number
  }

  export interface GeographyShape {
    rsmKey: string
  }

  export interface GeographiesRenderProps {
    geographies: GeographyShape[]
  }

  export interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string
    projectionConfig?: Record<string, unknown>
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>
    children: (props: GeographiesRenderProps) => ReactNode
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeographyShape
    style?: {
      default?: CSSProperties
      hover?: CSSProperties
      pressed?: CSSProperties
    }
  }

  export interface ZoomableGroupProps extends SVGProps<SVGGElement> {
    zoom?: number
    center?: [number, number]
    minZoom?: number
    maxZoom?: number
    onMoveEnd?: (position: ZoomableGroupPosition) => void
    children?: ReactNode
  }

  export interface MarkerProps extends SVGProps<SVGGElement> {
    coordinates: [number, number]
    children?: ReactNode
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const Marker: ComponentType<MarkerProps>
}
