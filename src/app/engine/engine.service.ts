import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter'
import {ElementRef, Injectable, NgZone, OnDestroy} from '@angular/core';
import * as dat from 'dat.gui';



@Injectable({providedIn: 'root'})
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;

  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshBasicMaterial;
  private cube: THREE.Mesh;

  private exporter: GLTFExporter;


  private gui = new dat.GUI();

  private frameId: number;

  private parameters = {
    color: 0x00ff00,
    width: 1,
    height: 1,
    depth: 1,
    widthSegments: 1,
    heightSegments: 1,
    depthSegments: 1,
    export: () =>  {
      this.exportGltf(this.cube);
    },
    binary: false
  }

  public constructor(private ngZone: NgZone) {
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.z = 5;
    this.scene.add(this.camera);

    // soft white light
    this.light = new THREE.AmbientLight(0x404040);
    this.light.position.z = 10;
    this.scene.add(this.light);

    this.geometry = new THREE.BoxGeometry(
      this.parameters.width,
      this.parameters.height,
      this.parameters.depth,
      this.parameters.widthSegments,
      this.parameters.heightSegments,
      this.parameters.depthSegments
    );
    this.material = new THREE.MeshBasicMaterial({color: this.parameters.color});
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.cube);

    // this.gui.add(this.parameters, 'width').onChange(() => {
    //   this.geometry.parameters.width
    // })
    this.gui.add(this.parameters, 'width').step(0.1).min(1.0).max(10.0).onChange(() => {
      this.regenerateBoxGoemetry();
    });
    this.gui.add(this.parameters, 'height').step(0.1).min(1.0).max(10.0).onChange(() => {
      this.regenerateBoxGoemetry();
    });
    this.gui.add(this.parameters, 'depth').step(0.1).min(1.0).max(10.0).onChange(() => {
      this.regenerateBoxGoemetry();
    });
    this.gui.add(this.parameters, 'widthSegments').step(1).min(1.0).max(10.0).onChange(() => {
      this.regenerateBoxGoemetry();
    });
    this.gui.add(this.parameters, 'heightSegments').step(1).min(1.0).max(10.0).onChange(() => {
      this.regenerateBoxGoemetry();
    });
    this.gui.add(this.parameters, 'depthSegments').step(1).min(1.0).max(10.0).onChange(() => {
      this.regenerateBoxGoemetry();
    });
    this.gui.addColor(this.parameters, 'color').onChange(() => {
      this.material.color.set(this.parameters.color);
    });
    this.gui.add(this.cube.material, 'wireframe').listen();
    this.gui.add(this.parameters, 'binary').name('.glb').listen();
    this.gui.add(this.parameters, 'export');

  }

  public exportGltf(input: any) {
    this.exporter = new GLTFExporter();
    this.exporter.parse(
      input,
      ( gltf ) => {

        if ( gltf instanceof ArrayBuffer ) {

          this.saveArrayBuffer( gltf, 'scene.glb' );

        } else {

          const output = JSON.stringify( gltf, null, 2 );
          console.log( output );
          this.saveString( output, 'object.gltf' );

        }

      },
      {
        binary: this.parameters.binary
      }
    )
  }


  public save( blob: Blob, filename: string ) {
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();


  }

  public saveString( text: string, filename: string ) {

    this.save( new Blob( [ text ], { type: 'text/plain' } ), filename );

  }


  public saveArrayBuffer( buffer: ArrayBuffer, filename: string ) {

    this.save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );

  }

  public regenerateBoxGoemetry() {
    this.geometry = new THREE.BoxGeometry(
      this.parameters.width,
      this.parameters.height,
      this.parameters.depth,
      this.parameters.widthSegments,
      this.parameters.heightSegments,
      this.parameters.depthSegments
    );
    this.cube.geometry.dispose();
    this.cube.geometry = this.geometry;
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    this.cube.rotation.x += 0.005;
    this.cube.rotation.y += 0.005;
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }


}
