// GLOBAL VARIABLES
const canvas = document.querySelector('canvas'),
	toolBtns = document.querySelectorAll('.tool'),
	fillColor = document.querySelector('#fill-color'),
	sizelider = document.querySelector('#size-slider'),
	colorBtns = document.querySelectorAll('.colors .option'),
	colorPicker = document.querySelector('#color-picker'),
	clearCanvas = document.querySelector('.clear-canvas'),
	saveImageBtn = document.querySelector('.save-img'),
	undoBtn = document.querySelector('.undo-btn'),
	redoBtn = document.querySelector('.redo-btn'),
	toggleGridBtn = document.querySelector('.toggle-grid'),
	zoomInBtn = document.querySelector('.zoom-in'),
	zoomOutBtn = document.querySelector('.zoom-out')
// font controls were removed per request

// DEFAULT VALUES
let ctx = canvas.getContext('2d'),
	isDrawing = false,
	brushWidth = 5,
	selectedTool = 'rectangle',
	selectedColor = "#000",
	prevMouseX,
	prevMouseY,
	snapShot,
	isGridVisible = false,
	zoomLevel = 1

// UNDO/REDO - Save drawing history
let history = []
let historyStep = -1

const saveState = () => {
	if (historyStep < history.length - 1) {
		history = history.slice(0, historyStep + 1)
	}
	history.push(canvas.toDataURL())
	historyStep++
	if (history.length > 20) {
		history.shift()
		historyStep--
	}
}

const undo = () => {
	if (historyStep > 0) {
		historyStep--
		const image = new Image()
		image.src = history[historyStep]
		image.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			ctx.drawImage(image, 0, 0)
		}
	}
}

const redo = () => {
	if (historyStep < history.length - 1) {
		historyStep++
		const image = new Image()
		image.src = history[historyStep]
		image.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			ctx.drawImage(image, 0, 0)
		}
	}
}

// ZOOM SYSTEM - Zoom in and out
const zoomIn = () => {
	if (zoomLevel < 3) zoomLevel += 0.2
}

const zoomOut = () => {
	if (zoomLevel > 0.5) zoomLevel -= 0.2
}

// GRID SYSTEM - Toggle grid overlay
const drawGrid = () => {
	if (!isGridVisible) return
	ctx.strokeStyle = '#e0e0e0'
	ctx.lineWidth = 0.5
	const gridSize = 20
	for (let x = 0; x < canvas.width; x += gridSize) {
		ctx.beginPath()
		ctx.moveTo(x, 0)
		ctx.lineTo(x, canvas.height)
		ctx.stroke()
	}
	for (let y = 0; y < canvas.height; y += gridSize) {
		ctx.beginPath()
		ctx.moveTo(0, y)
		ctx.lineTo(canvas.width, y)
		ctx.stroke()
	}
}

const toggleGrid = () => {
	isGridVisible = !isGridVisible
	drawGrid()
	toggleGridBtn.style.background = isGridVisible ? '#e0f2fe' : ''
}

// EYEDROPPER TOOL - Pick colors from canvas
const getColorFromPixel = e => {
	const imageData = ctx.getImageData(e.offsetX, e.offsetY, 1, 1)
	const data = imageData.data
	const rgb = `rgb(${data[0]}, ${data[1]}, ${data[2]})`
	selectedColor = rgb
	colorPicker.parentElement.style.background = rgb
}

// TEXT TOOL - Inline editable text overlay
// Creates a contenteditable div positioned over the canvas where the user
// can type, then on Enter or blur the text is drawn into the canvas.
const addText = e => {
	// Prevent multiple inputs
	if (document.querySelector('.text-input')) return

	// Get canvas position to compute coordinates
	const rect = canvas.getBoundingClientRect()
	const x = e.clientX - rect.left
	const y = e.clientY - rect.top

	// Create editable div
	const input = document.createElement('div')
	input.className = 'text-input'
	input.contentEditable = 'true'
	input.style.left = `${x}px`
	input.style.top = `${y}px`
	input.style.position = 'absolute'
	input.style.minWidth = '60px'
	input.style.padding = '2px 6px'
	input.style.background = 'rgba(255,255,255,0.8)'
	input.style.border = '1px dashed #999'
	input.style.color = selectedColor
	// Use brushWidth for default font size and Arial for family
	input.style.font = `${brushWidth * 4}px Arial`
	input.style.outline = 'none'
	input.style.zIndex = 9999

	// Append to drawing board (closest ancestor section)
	const board = canvas.closest('.drawing-board') || document.body
	// ensure board is positioned so absolute works
	if (getComputedStyle(board).position === 'static') board.style.position = 'relative'
	board.appendChild(input)

	// Focus and place caret
	input.focus()

	// Handler to finalize text: draw to canvas and remove input
	const finalize = () => {
		const text = input.innerText.trim()
		if (text) {
			// compute final draw coordinates relative to canvas
			const inputRect = input.getBoundingClientRect()
			const drawX = inputRect.left - rect.left
			// font size/family: use brushWidth and Arial
			const fs2 = brushWidth * 4
			const ff2 = 'Arial'
			const drawY = inputRect.top - rect.top + (fs2) // baseline adjustment
			ctx.font = `${fs2}px ${ff2}`
			// convert selectedColor rgb to usable canvas fillStyle
			ctx.fillStyle = selectedColor
			ctx.fillText(text, drawX, drawY)
			saveState()
		}
		input.remove()
	}

	// Enter to finish, Shift+Enter allows newline in contenteditable
	const onKeyDown = (ev) => {
		if (ev.key === 'Enter' && !ev.shiftKey) {
			ev.preventDefault()
			finalize()
		} else if (ev.key === 'Escape') {
			// cancel
			input.remove()
		}
	}

	input.addEventListener('keydown', onKeyDown)
	// also finalize on blur
	input.addEventListener('blur', finalize)

	// Make the input draggable via a small handle
	const handle = document.createElement('div')
	handle.className = 'text-drag-handle'
	handle.style.position = 'absolute'
	handle.style.left = '0'
	handle.style.top = '0'
	handle.style.width = '14px'
	handle.style.height = '14px'
	handle.style.background = 'rgba(0,0,0,0.12)'
	handle.style.borderRadius = '2px'
	handle.style.cursor = 'move'
	handle.title = 'Drag to move'
	input.appendChild(handle)

	let isDragging = false
	let dragStartX = 0
	let dragStartY = 0

	const onMouseDown = (ev) => {
		ev.preventDefault()
		isDragging = true
		dragStartX = ev.clientX
		dragStartY = ev.clientY
		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener('mouseup', onMouseUp)
	}

	const onMouseMove = (ev) => {
		if (!isDragging) return
		const dx = ev.clientX - dragStartX
		const dy = ev.clientY - dragStartY
		const curLeft = parseFloat(input.style.left || 0)
		const curTop = parseFloat(input.style.top || 0)
		input.style.left = (curLeft + dx) + 'px'
		input.style.top = (curTop + dy) + 'px'
		dragStartX = ev.clientX
		dragStartY = ev.clientY
	}

	const onMouseUp = () => {
		isDragging = false
		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
	}

	handle.addEventListener('mousedown', onMouseDown)
}


// SET CANVAS BACKGROUND
const setCanvasBackground = () => {
	ctx.fillStyle = "#fff"
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	ctx.fillStyle = selectedColor
}

// SET CANVAS WIDTH AND HEIGHT
window.addEventListener('load', () => {
	canvas.width = canvas.offsetWidth
	canvas.height = canvas.offsetHeight
	setCanvasBackground()
	saveState()
})

// START DRAWING
const startDraw = e => {
	isDrawing = true
	prevMouseX = e.offsetX
	prevMouseY = e.offsetY
	snapShot = ctx.getImageData(0, 0, canvas.width, canvas.height)
	ctx.beginPath()
	ctx.moveTo(prevMouseX, prevMouseY)
	ctx.lineWidth = brushWidth
	ctx.strokeStyle = selectedColor
	ctx.fillStyle = selectedColor
}

// LINE TOOL - Draw straight lines
const drawLine = e => {
	ctx.beginPath()
	ctx.moveTo(prevMouseX, prevMouseY)
	ctx.lineTo(e.offsetX, e.offsetY)
	ctx.lineWidth = brushWidth
	ctx.strokeStyle = selectedColor
	ctx.stroke()
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

// DRAWING - Main drawing function
const drawing = e => {
	if (!isDrawing) return
	
	// Restore snapshot for shapes and line
	if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'triangle' || selectedTool === 'line') {
		ctx.putImageData(snapShot, 0, 0)
		drawGrid()
	}

	ctx.lineWidth = brushWidth
	ctx.strokeStyle = selectedColor
	ctx.fillStyle = selectedColor

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
		case 'line':
			drawLine(e)
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

// STOP DRAWING - End drawing and save state
const stopDrawing = () => {
	if (!isDrawing) return
	isDrawing = false
	if (selectedTool !== 'eyedropper' && selectedTool !== 'text') {
		saveState()
	}
}

// TOOL BUTTONS - Handle tool selection
toolBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		toolBtns.forEach(b => b.classList.remove('active'))
		btn.classList.add('active')
		selectedTool = btn.id
	})
})

// BRUSH WIDTH
sizelider.addEventListener('change', () => (brushWidth = sizelider.value))

// COLOR SELECTION
colorBtns.forEach(btn => {
	btn.addEventListener('click', e => {
		document.querySelectorAll('.colors .option').forEach(b => b.classList.remove('selected'))
		btn.classList.add('selected')
		const bgColor = window.getComputedStyle(btn).getPropertyValue('background-color')
		selectedColor = bgColor
	})
})

// CLEAR CANVAS
clearCanvas.addEventListener('click', () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	setCanvasBackground()
	saveState()
})

// SAVE IMAGE
saveImageBtn.addEventListener('click', () => {
	const link = document.createElement('a')
	link.download = `Sanat-paint ${Date.now()}.jpg`
	link.href = canvas.toDataURL()
	link.click()
})

// COLOR PICKER
colorPicker.addEventListener('change', () => {
	colorPicker.parentElement.style.background = colorPicker.value
	selectedColor = colorPicker.value
	colorPicker.parentElement.click()
})

// UNDO/REDO BUTTONS
undoBtn.addEventListener('click', undo)
redoBtn.addEventListener('click', redo)

// ZOOM BUTTONS
zoomInBtn.addEventListener('click', zoomIn)
zoomOutBtn.addEventListener('click', zoomOut)

// GRID TOGGLE
toggleGridBtn.addEventListener('click', toggleGrid)

// KEYBOARD SHORTCUTS - Quick access with keyboard
document.addEventListener('keydown', (e) => {
	if (e.key === 'b' || e.key === 'B') document.getElementById('brush').click()
	if (e.key === 'e' || e.key === 'E') document.getElementById('eraser').click()
	if (e.key === 'c' || e.key === 'C') {
		if (confirm('Canvas ni o\'chirasizmi?')) clearCanvas.click()
	}
	if (e.key === 'r' || e.key === 'R') document.getElementById('rectangle').click()
	if (e.key === 'l' || e.key === 'L') document.getElementById('line').click()
	if (e.key === 'z' || e.key === 'Z') toggleGrid()
	if (e.ctrlKey && e.key === 'z') {
		e.preventDefault()
		undo()
	}
	if (e.ctrlKey && e.key === 'y') {
		e.preventDefault()
		redo()
	}
	if (e.key === '+' || e.key === '=') zoomIn()
	if (e.key === '-') zoomOut()
})

// CANVAS EVENT LISTENERS
canvas.addEventListener("mousedown", (e) => {
	// Always start drawing on mousedown for available tools
	startDraw(e)
})

canvas.addEventListener("mousemove", drawing)
canvas.addEventListener("mouseup", stopDrawing)
canvas.addEventListener("mouseleave", stopDrawing)

console.log('🎨 Paint App Loaded! Keyboard: B=Brush, E=Eraser, C=Clear, R=Rectangle, L=Line, Z=Grid, Ctrl+Z=Undo, Ctrl+Y=Redo')
