import GSAP from 'gsap'

export default class {
  constructor(element, camera) {
    this.element = element

    this.elements = {
      number: element.querySelector('.section__title-number'),
      title: element.querySelector('.section__title-text'),
      arrows: element.querySelectorAll('.section__title-arrow span'),
      paragraph: element.querySelector('.section__paragraph'),
      button: element.querySelector('.section__button'),
    }

    this.camera = camera

    this.animateIn()
  }

  animateIn() {
    const animateIn = GSAP.timeline({ 
      defaults: {
        ease: 'expo'
      }
    })
    
    animateIn
      .from(this.camera.position, {
        z: 4,
        duration: 3
      })
      
      .from([ 
        this.elements.number, 
        this.elements.title, 
        this.elements.text,  
        this.elements.paragraph, 
        this.elements.button,
        this.elements.arrows
      ], {
          y: -100,
          autoAlpha: 0,
          stagger: .2,
          duration: 1.6
      }, '<.3')
    }
}
