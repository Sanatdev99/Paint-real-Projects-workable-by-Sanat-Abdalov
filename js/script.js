// GLOBAL VARIABLES
const canvas = document.querySelector('canvas'),
	toolBtns = document.querySelectorAll('.tool'),
	fillColor = document.querySelector('#fill-color'),
	sizelider = document.querySelector('#size-slider'),
	colorBtns = document.querySelectorAll('.colors .option'),
	colorPicker = document.querySelector('#color-picker'),
	clearCanvas = document.querySelector('.clear-canvas'),
	saveImageBtn = document.querySelector('.save-img')

// VARIABLE WITH DEFAULT VALUE 
let ctx = canvas.getContext('2d'),
	isDrawing = false,
	brushWidth = 5,
	selectedTool = 'brush',
	selctedColor = "#000",
	prevMouseX,
	prevMouseY,
	snapShot


// SET CANVAS BAKGROUND
const setCanvasBackground = () => {
	ctx.fillStyle = "#fff"
	ctx.fillRect(0,0, canvas.width , canvas.height)
	ctx.fillStyle = selctedColor
}


//  SET CANVAS WIDTH AND HEIGHT 
window.addEventListener('load', () => {
	canvas.width = canvas.offsetWidth
	canvas.height = canvas.offsetHeight
	setCanvasBackground()
})

// START DRAWING 
const startDraw = e => {
	isDrawing = true
	prevMouseX = e.offsetX
	prevMouseY = e.offsetY
	ctx.beginPath()
	ctx.moveTo(prevMouseX, prevMouseY)
	ctx.lineWidth = brushWidth
	ctx.strokeStyle = selctedColor
	ctx.fillStyle = selctedColor
	snapShot = ctx.getImageData(0, 0, canvas.width, canvas.height)
	console.log(snapShot)
}


// DRAW RECTANGLE 
const drawRectangle = e => {
	const x = Math.min(prevMouseX, e.offsetX)
	const y = Math.min(prevMouseY, e.offsetY)
	const width = Math.abs(prevMouseX - e.offsetX)
	const height = Math.abs(prevMouseY - e.offsetY)
	// draw either filled or stroked rectangle
	if (fillColor.checked) {
		ctx.fillRect(x, y, width, height)
	} else {
		ctx.strokeRect(x, y, width, height)
	}
}

// DRAW CIRCLE
const drawCircle = e => {
	ctx.beginPath()
	const radius = Math.sqrt(Math.pow(prevMouseX - e.offsetX, 2) + Math.pow(prevMouseY - e.offsetY, 2))
	ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI)
	fillColor.checked ? ctx.fill() : ctx.stroke()
}

// DRAW TRIANGLE
const drawTriangle = e => {
	ctx.beginPath()
	ctx.moveTo(prevMouseX, prevMouseY)
	ctx.lineTo(e.offsetX, e.offsetY)
	ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY)
	ctx.closePath()
	fillColor.checked ? ctx.fill() : ctx.stroke()
}

// DRAWING 
const drawing = e => {
	if (!isDrawing) return
	ctx.putImageData(snapShot, 0, 0)

	switch (selectedTool) {
		case 'brush':
			ctx.lineTo(e.offsetX, e.offsetY)
			ctx.stroke()
			break
		case 'rectangle':
			drawRectangle(e)
			break
		case 'circle':
			drawCircle(e)
			break
		case 'triangle':
			drawTriangle(e)
			break
		case 'eraser':
			ctx.strokeStyle = '#fff'
			ctx.lineTo(e.offsetX, e.offsetY)
			ctx.stroke()
			break
		default:
			break
	}
}

// TOOLS BTN AND SET TO VARIABLE SELECTED TOOL
toolBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		const active = document.querySelector(".options .active")
		if (active) active.classList.remove('active')
		btn.classList.add('active')
		selectedTool = btn.id
		console.log(`selectedTool: ${selectedTool}`)
	})
})
// CHANGE BRUSH WIDTH
sizelider.addEventListener('change', () => (brushWidth = sizelider.value))

// SET COLOR TO SHAPES 
colorBtns.forEach(btn => {
	btn.addEventListener('click', e => {
		document.querySelector('.options .selected').classList.remove('selcted')
		btn.classList.add('selected')
		const bgColor = window.getComputedStyle(btn).getPropertyValue('background-color')
		selctedColor = bgColor
	})
})

// CLEAR CANVAS BUTTON 
clearCanvas.addEventListener('click', () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	setCanvasBackground()
})

// SAVE LIKE IMAGE OUR PAINT 
saveImageBtn.addEventListener('click',() => {
	const link = document.createElement('a')
	link.download = `Sanat-paint ${Date.now}.jpg`
	link.href = canvas.toDataURL()
	link.click()
})
// SET COLOR FROM COLOR PICKER
colorPicker.addEventListener('change', () => {
	colorPicker.parentElement.style.background = colorPicker.value
	colorPicker.parentElement.click()
})

//  STOP DRAWING 
const stopDrawing = () => {
	isDrawing = false
}

// event listeners
canvas.addEventListener("mousedown", startDraw)
canvas.addEventListener("mousemove", drawing)
canvas.addEventListener("mouseup", stopDrawing)
canvas.addEventListener("mouseleave", stopDrawing)
