declare module 'maplibre-gl' {
  export class Map {
    constructor(options: any);
    addControl(control: any): this;
    remove(): void;
    on(type: string, listener: (ev: any) => void): this;
    off(type: string, listener: (ev: any) => void): this;
    setStyle(style: any): this;
    getCanvas(): HTMLCanvasElement;
    getContainer(): HTMLElement;
    getCenter(): { lng: number; lat: number };
    getZoom(): number;
    getBounds(): any;
    setCenter(center: [number, number] | { lng: number; lat: number }): this;
    setZoom(zoom: number): this;
    flyTo(options: any): this;
    easeTo(options: any): this;
    addLayer(layer: any): this;
    removeLayer(id: string): this;
    getLayer(id: string): any;
    addSource(id: string, source: any): this;
    removeSource(id: string): this;
    getSource(id: string): any;
    resize(): this;
    project(lnglat: [number, number] | { lng: number; lat: number }): { x: number; y: number };
    unproject(point: { x: number; y: number }): { lng: number; lat: number };
  }

  export class Marker {
    constructor(element?: HTMLElement, options?: any);
    setLngLat(lnglat: [number, number] | { lng: number; lat: number }): this;
    addTo(map: Map): this;
    remove(): this;
    setPopup(popup: Popup): this;
    getPopup(): Popup | null;
    togglePopup(): this;
    getElement(): HTMLElement;
    setDraggable(draggable: boolean): this;
    isDraggable(): boolean;
  }

  export class Popup {
    constructor(options?: any);
    setLngLat(lnglat: [number, number] | { lng: number; lat: number }): this;
    setHTML(html: string): this;
    setText(text: string): this;
    setDOMContent(htmlNode: Node): this;
    addTo(map: Map): this;
    remove(): this;
    isOpen(): boolean;
  }

  export interface MapOptions {
    container: string | HTMLElement;
    style: string | any;
    center?: [number, number] | { lng: number; lat: number };
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    pitch?: number;
    bearing?: number;
    antialias?: boolean;
    attributionControl?: boolean;
    customAttribution?: string | string[];
    hash?: boolean | string;
    interactive?: boolean;
    bearingSnap?: number;
    pitchWithRotate?: boolean;
    clickTolerance?: number;
    locale?: any;
    fadeDuration?: number;
    crossSourceCollisions?: boolean;
    collectResourceTiming?: boolean;
    transformRequest?: (url: string, resourceType: string) => { url: string; headers?: { [key: string]: string }; credentials?: string };
    maxTileCacheSize?: number;
    localIdeographFontFamily?: string;
    preserveDrawingBuffer?: boolean;
    trackResize?: boolean;
    renderWorldCopies?: boolean;
    maxBounds?: any;
    scrollZoom?: boolean | any;
    boxZoom?: boolean;
    dragRotate?: boolean;
    dragPan?: boolean | any;
    keyboard?: boolean;
    doubleClickZoom?: boolean;
    touchZoomRotate?: boolean | any;
    touchPitch?: boolean | any;
  }

  export default {
    Map,
    Marker,
    Popup
  };
}
