import { createEngine } from "../../shared/engine.js"
import { Spring } from "../../shared/spring.js"

const { renderer, input, math, run, finish, } = createEngine()
const { ctx, canvas } = renderer
run(update)

const spring = new Spring({
	position: 0, // start position
	frequency: 5.5, // oscillations per second (approximate)
	halfLife: 0.35 // time until amplitude is halved
})
const stretch = 0.00005

function update(dt) {

	// set the spring target
	if (input.isPressed()) {
		spring.target = 400
	}
	else {
		spring.target = -400
	}


	// update the spring (make it move)
	spring.step(dt) // deltaTime is in milliseconds, we need it in seconds

	// spring "position" can be mapped to anything,
	// including positions, scale, rotations etc
	// it's just a number that tries to reach a target number
	const x = spring.position

	const speed = Math.abs(spring.velocity)
	const scaleX = 1 + speed * stretch
	const scaleY = 1 - speed * stretch

	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	ctx.translate(canvas.width / 2 + x, canvas.height / 2)
	ctx.scale(scaleX, scaleY)

	ctx.fillStyle = "black"
	ctx.beginPath()
	ctx.ellipse(0, 0, 200, 200, 0, 0, Math.PI * 2)
	ctx.fill()
}
