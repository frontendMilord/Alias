'use client'

type SoundName =
	| 'round-start'
	| 'word-guessed'
	| 'word-skipped'
	| 'round-paused'
	| 'round-resumed'
	| 'shared-word'
	| 'game-finished'

interface ToneOptions {
	frequency: number
	startTime: number
	duration: number
	type?: OscillatorType
	volume?: number
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null
	if (audioContext) return audioContext
	const AudioContextClass =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext
	if (!AudioContextClass) return null
	audioContext = new AudioContextClass()
	return audioContext
}

function playTone(context: AudioContext, options: ToneOptions) {
	const {
		frequency,
		startTime,
		duration,
		type = 'sine',
		volume = 0.15,
	} = options

	const oscillator = context.createOscillator()
	const gain = context.createGain()

	oscillator.type = type
	oscillator.frequency.setValueAtTime(frequency, startTime)

	gain.gain.setValueAtTime(0, startTime)
	gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
	gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

	oscillator.connect(gain)
	gain.connect(context.destination)

	oscillator.start(startTime)
	oscillator.stop(startTime + duration + 0.05)
}

function playSound(name: SoundName) {
	const context = getAudioContext()
	if (!context) return

	if (context.state === 'suspended') {
		void context.resume()
	}

	const now = context.currentTime + 0.02

	switch (name) {
		case 'round-start':
			playTone(context, { frequency: 523.25, startTime: now, duration: 0.12 })
			playTone(context, { frequency: 659.25, startTime: now + 0.12, duration: 0.16 })
			break
		case 'word-guessed':
			playTone(context, { frequency: 880, startTime: now, duration: 0.15, type: 'triangle' })
			break
		case 'word-skipped':
			playTone(context, { frequency: 330, startTime: now, duration: 0.12, type: 'sine', volume: 0.12 })
			playTone(context, { frequency: 277, startTime: now + 0.1, duration: 0.16, type: 'sine', volume: 0.12 })
			break
		case 'round-paused':
			playTone(context, { frequency: 392, startTime: now, duration: 0.1, type: 'square', volume: 0.08 })
			playTone(context, { frequency: 392, startTime: now + 0.14, duration: 0.1, type: 'square', volume: 0.08 })
			break
		case 'round-resumed':
			playTone(context, { frequency: 523.25, startTime: now, duration: 0.12, type: 'square', volume: 0.08 })
			break
		case 'shared-word':
			playTone(context, { frequency: 587.33, startTime: now, duration: 0.1, type: 'triangle', volume: 0.14 })
			playTone(context, { frequency: 587.33, startTime: now + 0.15, duration: 0.1, type: 'triangle', volume: 0.14 })
			playTone(context, { frequency: 740, startTime: now + 0.3, duration: 0.18, type: 'triangle', volume: 0.14 })
			break
		case 'game-finished':
			playTone(context, { frequency: 523.25, startTime: now, duration: 0.14, type: 'triangle' })
			playTone(context, { frequency: 659.25, startTime: now + 0.14, duration: 0.14, type: 'triangle' })
			playTone(context, { frequency: 783.99, startTime: now + 0.28, duration: 0.14, type: 'triangle' })
			playTone(context, { frequency: 1046.5, startTime: now + 0.42, duration: 0.28, type: 'triangle' })
			break
	}
}

export function playGameSound(name: SoundName) {
	try {
		playSound(name)
	} catch (cause) {
		console.error('Error playing game sound:', cause)
	}
}
