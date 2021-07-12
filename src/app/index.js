import * as THREE from 'three'
import GSAP from 'gsap'

import Animations from './Animations'
import SmoothScroll from './SmoothScroll'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

class ScrollStage {
  constructor() {
    this.element = document.querySelector('.content')

    this.elements = {
      line: this.element.querySelector('.layout__line')
    }

    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.mouse = {
      x: 0,
      y: 0
    }

    this.scroll = {
      height: 0,
      limit: 0,
      hard: 0,
      soft: 0,
      ease: 0.05,
      normalized: 0, 
      running: false
    }

    this.settings = {
      // vertex
      uFrequency: {
        start: 0,
        end: 4
      },
      uAmplitude: {
        start: 4,
        end: 4
      },
      uDensity: {
        start: 1,
        end: 1
      },
      uStrength: {
        start: 0,
        end: 1.1
      },
      // fragment
      uDeepPurple: {  // max 1
        start: 1,
        end: 0
      },
      uOpacity: {  // max 1
        start: .1,
        end: .66
      }
    }

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    })

    this.canvas = this.renderer.domElement

    this.camera = new THREE.PerspectiveCamera( 
      75, 
      this.viewport.width / this.viewport.height, 
      .1, 
      10
    )

    this.clock = new THREE.Clock()

    this.smoothScroll = new SmoothScroll({ 
      element: this.element, 
      viewport: this.viewport, 
      scroll: this.scroll
    })

    GSAP.defaults({
      ease: 'power2',
      duration: 6.6,
      overwrite: true
    })
    
    this.updateScrollAnimations = this.updateScrollAnimations.bind(this)
    this.update = this.update.bind(this)
        
    this.init()
  }
  
  init() {
    this.addCanvas()
    this.addCamera()
    this.addMesh()
    this.addEventListeners()
    this.onResize()
    this.update()
  }

  /**
   * STAGE
   */
  addCanvas() {
    this.canvas.classList.add('webgl')
    document.body.appendChild(this.canvas)
  }

  addCamera() {
    this.camera.position.set(0, 0, 2.5)
    this.scene.add(this.camera)
  }

  /**
   * OBJECT
   */
  addMesh() {
    this.geometry = new THREE.IcosahedronGeometry(1, 64)
    
    this.material = new THREE.ShaderMaterial({
      wireframe: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      vertexShader,
      fragmentShader,
      uniforms: {
        uFrequency: { value: this.settings.uFrequency.start },
        uAmplitude: { value: this.settings.uAmplitude.start },
        uDensity: { value: this.settings.uDensity.start },
        uStrength: { value: this.settings.uStrength.start },
        uDeepPurple: { value: this.settings.uDeepPurple.start },
        uOpacity: { value: this.settings.uOpacity.start }
      }
    })
    
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    
    this.scene.add(this.mesh)
  }

  /**
   * SCROLL BASED ANIMATIONS
   */
  updateScrollAnimations() {
    this.scroll.running = false
    this.scroll.normalized = (this.scroll.hard / this.scroll.limit).toFixed(1)
    
    GSAP.to(this.mesh.rotation, {
      x: this.scroll.normalized * Math.PI
    })
 
    GSAP.to(this.elements.line, {
      scaleX: this.scroll.normalized, 
      transformOrigin: 'left', 
      duration: 1.5,
      ease: 'ease'
    })

    for (const key in this.settings) {
      if (this.settings[key].start !== this.settings[key].end) {
        GSAP.to(this.mesh.material.uniforms[key], {
          value: this.settings[key].start + this.scroll.normalized * (this.settings[key].end - this.settings[key].start)
        })
      }
    }
  }

  /**
   * EVENTS
   */
  addEventListeners() {
    window.addEventListener('load', this.onLoad.bind(this))
    
    // window.addEventListener('mousemove', this.onMouseMove.bind(this))  // enable for soundcheck (→ console)
    
    window.addEventListener('scroll', this.onScroll.bind(this))

    window.addEventListener('resize', this.onResize.bind(this))
  }

  onLoad() {
    document.body.classList.remove('loading')

    this.animations = new Animations(this.element, this.camera)
  }

  onMouseMove(event) {
    // play with it!
    // enable / disable / change x, y, multiplier …

    this.mouse.x = (event.clientX / this.viewport.width).toFixed(2) * 4
    this.mouse.y = (event.clientY / this.viewport.height).toFixed(2) * 2

    GSAP.to(this.mesh.material.uniforms.uFrequency, { value: this.mouse.x })
    GSAP.to(this.mesh.material.uniforms.uAmplitude, { value: this.mouse.x })
    GSAP.to(this.mesh.material.uniforms.uDensity, { value: this.mouse.y })
    GSAP.to(this.mesh.material.uniforms.uStrength, { value: this.mouse.y })
    // GSAP.to(this.mesh.material.uniforms.uDeepPurple, { value: this.mouse.x })
    // GSAP.to(this.mesh.material.uniforms.uOpacity, { value: this.mouse.y })

    console.info(`X: ${this.mouse.x}  |  Y: ${this.mouse.y}`)
  }

  onScroll() {
    if (!this.scroll.running) {
      window.requestAnimationFrame(this.updateScrollAnimations)
      
      this.scroll.running = true
    }
  }

  onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    this.smoothScroll.onResize()

    if (this.viewport.width < this.viewport.height) {
      this.mesh.scale.set(.75, .75, .75)
    } else {
      this.mesh.scale.set(1, 1, 1)
    }

    this.camera.aspect = this.viewport.width / this.viewport.height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))  
  }

  /**
   * LOOP
   */
  update() {
    const elapsedTime = this.clock.getElapsedTime()
    this.mesh.rotation.y = elapsedTime * .05

    this.smoothScroll.update()

    this.render()

    window.requestAnimationFrame(this.update)
  }

  /**
   * RENDER
   */
  render() {
    this.renderer.render(this.scene, this.camera)
  }  
}

new ScrollStage()

console.log('%c Made by ꜰᴀʙᴏᴏʟᴇᴀ → https://twitter.com/faboolea', 'background: black; color: white; padding: 1ch 2ch; border-radius: 2rem;')
