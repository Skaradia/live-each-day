import React, { useState, useEffect, useMemo, useRef } from 'react'
import './InstabilityEffect.css'

function InstabilityEffect({ birthday, timeUnit, ageOfDeath = 80 }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeEffect, setActiveEffect] = useState(null)
  const timeoutRef = useRef(null)
  const animationRef = useRef(null)

  // Update time every second for real-time percentage calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate percentage lived
  const percentage = useMemo(() => {
    if (!birthday) return 0
    
    const now = currentTime
    const deathDate = new Date(birthday)
    deathDate.setFullYear(birthday.getFullYear() + ageOfDeath)

    let lived = 0
    let total = 0

    switch (timeUnit) {
      case 'weeks':
        lived = (now - birthday) / (1000 * 60 * 60 * 24 * 7)
        total = (deathDate - birthday) / (1000 * 60 * 60 * 24 * 7)
        break
      case 'months':
        lived = (now - birthday) / (1000 * 60 * 60 * 24 * 30.44)
        total = (deathDate - birthday) / (1000 * 60 * 60 * 24 * 30.44)
        break
      case 'years':
        lived = (now - birthday) / (1000 * 60 * 60 * 24 * 365.25)
        total = (deathDate - birthday) / (1000 * 60 * 60 * 24 * 365.25)
        break
      case 'decades':
        lived = (now - birthday) / (1000 * 60 * 60 * 24 * 365.25 * 10)
        total = (deathDate - birthday) / (1000 * 60 * 60 * 24 * 365.25 * 10)
        break
      default:
        lived = (now - birthday) / (1000 * 60 * 60 * 24 * 7)
        total = (deathDate - birthday) / (1000 * 60 * 60 * 24 * 7)
    }

    return total > 0 ? Math.min((lived / total) * 100, 100) : 0
  }, [birthday, timeUnit, ageOfDeath, currentTime])

  // Calculate frequency based on percentage (non-linear exponential)
  const calculateFrequency = (percent) => {
    const normalized = percent / 100
    
    // Exponential curve: frequency increases dramatically at higher percentages
    // At 0%: 30-45 seconds (average 37.5s)
    // At 25%: 15-20 seconds (average 17.5s)
    // At 50%: 5-10 seconds (average 7.5s)
    // At 75%: 1-3 seconds (average 2s)
    // At 100%: 0.5-1.5 seconds (average 1s)
    
    // Use exponential function: base * (1 - normalized)^exponent + min
    const baseInterval = 37500 // 37.5 seconds at 0%
    const minInterval = 1000 // 1 second at 100%
    const exponent = 2.5
    
    const interval = baseInterval * Math.pow(1 - normalized, exponent) + minInterval
    
    // Add randomness: ±20% variation
    const variation = interval * 0.2
    const finalInterval = interval + (Math.random() * variation * 2 - variation)
    
    // For testing: cap minimum at 2 seconds if percentage is very low
    return Math.max(finalInterval, percent < 10 ? 2000 : 1000)
  }

  // Calculate intensity multiplier based on percentage
  const calculateIntensity = (percent) => {
    const normalized = percent / 100
    
    // Exponential intensity curve
    // At 0%: 0.1 (subtle)
    // At 100%: 1.0 (violent)
    return 0.1 + (normalized * normalized * 0.9) // Quadratic for faster acceleration
  }

  // Store current percentage in ref for use in triggerEvent
  const percentageRef = useRef(percentage)
  useEffect(() => {
    percentageRef.current = percentage
  }, [percentage])

  // Trigger a random instability event
  const triggerEvent = () => {
    const currentPercent = percentageRef.current
    const intensity = calculateIntensity(currentPercent)
    const eventTypes = ['brightness', 'desaturation', 'jitter']
    
    // At higher percentages, multiple events can occur simultaneously
    const numEvents = currentPercent > 75 ? (Math.random() > 0.5 ? 2 : 1) : 1
    
    const selectedEvents = []
    for (let i = 0; i < numEvents; i++) {
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      if (!selectedEvents.includes(randomType)) {
        selectedEvents.push(randomType)
      }
    }

    // Generate random jitter values for this event
    const jitterValues = {
      '--jitter-x-1': (Math.random() * 2 - 1),
      '--jitter-y-1': (Math.random() * 2 - 1),
      '--jitter-x-2': (Math.random() * 2 - 1),
      '--jitter-y-2': (Math.random() * 2 - 1),
      '--jitter-x-3': (Math.random() * 2 - 1),
      '--jitter-y-3': (Math.random() * 2 - 1),
      '--jitter-x-4': (Math.random() * 2 - 1),
      '--jitter-y-4': (Math.random() * 2 - 1),
    }

    // Apply jitter values to body
    Object.entries(jitterValues).forEach(([key, value]) => {
      document.body.style.setProperty(key, value)
    })

    // Apply first selected effect
    const eventType = selectedEvents[0]
    setActiveEffect({ type: eventType, intensity })

    // Clear effects after short duration (50-150ms)
    const duration = 50 + (intensity * 100) // 50ms at 0%, 150ms at 100%
    
    setTimeout(() => {
      setActiveEffect(null)
      // Clear jitter values
      Object.keys(jitterValues).forEach(key => {
        document.body.style.removeProperty(key)
      })
    }, duration)
  }

  // Schedule instability events
  useEffect(() => {
    if (!birthday) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const scheduleNext = () => {
      const currentPercent = percentageRef.current
      const frequency = calculateFrequency(currentPercent)
      
      timeoutRef.current = setTimeout(() => {
        triggerEvent()
        scheduleNext()
      }, frequency)
    }

    // Start scheduling immediately (even at 0% for testing)
    scheduleNext()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [percentage, birthday, timeUnit, ageOfDeath])

  // Apply effects to body element for global application
  useEffect(() => {
    const body = document.body
    
    if (activeEffect) {
      body.style.setProperty('--intensity', activeEffect.intensity)
      
      if (activeEffect.type === 'brightness') {
        body.classList.add('instability-brightness-active')
      } else {
        body.classList.remove('instability-brightness-active')
      }
      
      if (activeEffect.type === 'desaturation') {
        body.classList.add('instability-desaturation-active')
      } else {
        body.classList.remove('instability-desaturation-active')
      }
      
      if (activeEffect.type === 'jitter') {
        body.classList.add('instability-jitter-active')
      } else {
        body.classList.remove('instability-jitter-active')
      }
    } else {
      body.classList.remove('instability-brightness-active')
      body.classList.remove('instability-desaturation-active')
      body.classList.remove('instability-jitter-active')
    }

    return () => {
      body.classList.remove('instability-brightness-active')
      body.classList.remove('instability-desaturation-active')
      body.classList.remove('instability-jitter-active')
    }
  }, [activeEffect])

  return null
}

export default InstabilityEffect

