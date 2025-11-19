import React, { useMemo, useState, useEffect } from 'react'
import './Calendar.css'

function Calendar({ birthday, timeUnit, ageOfDeath = 80 }) {
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [animatingLived, setAnimatingLived] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { lived, total, squares, dimensions } = useMemo(() => {
    const now = new Date()
    const deathDate = new Date(birthday)
    deathDate.setFullYear(birthday.getFullYear() + ageOfDeath)

    let lived = 0
    let total = 0

    switch (timeUnit) {
      case 'weeks':
        lived = Math.floor((now - birthday) / (1000 * 60 * 60 * 24 * 7))
        total = Math.floor((deathDate - birthday) / (1000 * 60 * 60 * 24 * 7))
        break
      case 'months':
        lived = Math.floor((now - birthday) / (1000 * 60 * 60 * 24 * 30.44))
        total = Math.floor((deathDate - birthday) / (1000 * 60 * 60 * 24 * 30.44))
        break
      case 'years':
        lived = Math.floor((now - birthday) / (1000 * 60 * 60 * 24 * 365.25))
        total = Math.floor((deathDate - birthday) / (1000 * 60 * 60 * 24 * 365.25))
        break
      case 'decades':
        lived = Math.floor((now - birthday) / (1000 * 60 * 60 * 24 * 365.25 * 10))
        total = Math.floor((deathDate - birthday) / (1000 * 60 * 60 * 24 * 365.25 * 10))
        break
      default:
        lived = Math.floor((now - birthday) / (1000 * 60 * 60 * 24 * 7))
        total = Math.floor((deathDate - birthday) / (1000 * 60 * 60 * 24 * 7))
    }

    // Calculate optimal grid dimensions based on total units and screen size
    // More dynamic calculation - account for actual header, timer, and padding
    const headerHeight = 90
    const timerHeight = 140 // Updated for new timer design
    const calendarHeaderHeight = 70
    const calendarPadding = 64 // Calendar container padding (32px top + 32px bottom)
    const gridPadding = 64 // Grid internal padding (32px top + 32px bottom)
    const padding = 40 // App top and bottom padding
    const gap = 20 // Gap between sections
    const gridGap = 4 // Gap between squares
    
    const reservedVertical = headerHeight + timerHeight + calendarHeaderHeight + calendarPadding + gridPadding + padding + (gap * 2)
    const reservedHorizontal = 80 // Side padding
    const availableWidth = Math.min(screenSize.width - reservedHorizontal, 1400) - (calendarPadding * 2)
    // Account for grid padding (32px top + 32px bottom = 64px) in available height
    const availableHeight = Math.max(screenSize.height - reservedVertical, 200) - gridPadding
    
    // Calculate aspect ratio and optimal dimensions
    // We want a grid that fits total squares and has a reasonable aspect ratio
    const aspectRatio = availableWidth / availableHeight
    
    // Calculate optimal columns and rows to fit the screen
    // Start with a square-ish grid and adjust based on aspect ratio
    let cols = Math.ceil(Math.sqrt(total * aspectRatio))
    let rows = Math.ceil(total / cols)
    
    // Ensure we have enough rows for all squares
    while (cols * rows < total) {
      rows++
    }
    
    // Refine to better match aspect ratio while ensuring we have enough squares
    const currentRatio = cols / rows
    if (currentRatio > aspectRatio * 1.1) {
      // Too wide, add more rows
      rows = Math.ceil(cols / aspectRatio)
      cols = Math.ceil(total / rows)
    } else if (currentRatio < aspectRatio * 0.9) {
      // Too tall, add more columns
      cols = Math.ceil(rows * aspectRatio)
      rows = Math.ceil(total / cols)
    }
    
    // Final check: ensure we have enough squares
    while (cols * rows < total) {
      if (cols / rows < aspectRatio) {
        cols++
      } else {
        rows++
      }
    }
    
    // Calculate actual square size to prevent overlap and ensure it fits
    // Account for gaps between squares and ensure total grid size fits
    const totalGapWidth = (cols - 1) * gridGap
    const totalGapHeight = (rows - 1) * gridGap
    
    // Calculate square size based on both dimensions, ensuring it fits
    // Use a buffer to ensure the last row is visible (account for rounding and padding)
    const buffer = 4
    const squareWidth = (availableWidth - totalGapWidth) / cols
    const squareHeight = (availableHeight - totalGapHeight - buffer) / rows
    const squareSize = Math.min(squareWidth, squareHeight)
    
    // Ensure minimum size but also ensure the grid doesn't overflow
    // If squares would be too small, we need to adjust the grid dimensions
    const minSquareSize = 3
    if (squareSize < minSquareSize) {
      // Recalculate with adjusted dimensions to ensure minimum size
      const maxCols = Math.floor((availableWidth + gridGap) / (minSquareSize + gridGap))
      const maxRows = Math.floor((availableHeight + gridGap) / (minSquareSize + gridGap))
      
      // Adjust cols and rows to fit within max constraints
      if (cols > maxCols) {
        cols = maxCols
        rows = Math.ceil(total / cols)
      }
      if (rows > maxRows) {
        rows = maxRows
        cols = Math.ceil(total / rows)
      }
      
      // Recalculate square size with adjusted dimensions
      const newTotalGapWidth = (cols - 1) * gridGap
      const newTotalGapHeight = (rows - 1) * gridGap
      const buffer = 4
      const newSquareWidth = (availableWidth - newTotalGapWidth) / cols
      const newSquareHeight = (availableHeight - newTotalGapHeight - buffer) / rows
      const finalSquareSize = Math.min(newSquareWidth, newSquareHeight)
      
      return { lived, total, squares: Array.from({ length: total }, (_, i) => ({
        index: i,
        isLived: i < lived
      })), dimensions: { rows, cols, squareSize: Math.max(minSquareSize, finalSquareSize) } }
    }

    // Create squares - each square represents exactly one unit
    const squares = Array.from({ length: total }, (_, i) => ({
      index: i,
      isLived: i < lived
    }))

    return { lived, total, squares, dimensions: { rows, cols, squareSize } }
  }, [birthday, timeUnit, screenSize, ageOfDeath])

  // Trigger animation when lived count changes or on initial load
  useEffect(() => {
    if (lived > 0) {
      setAnimatingLived(lived)
      setAnimationKey(prev => prev + 1)
    }
  }, [lived])

  const percentage = total > 0 ? ((lived / total) * 100).toFixed(2) : 0

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>
          {lived.toLocaleString()} / {total.toLocaleString()} {timeUnit} lived ({percentage}%)
        </h2>
      </div>
      <div 
        className="calendar-grid"
        style={{
          gridTemplateColumns: `repeat(${dimensions.cols}, ${dimensions.squareSize}px)`,
          gridTemplateRows: `repeat(${dimensions.rows}, ${dimensions.squareSize}px)`,
          justifyContent: 'center'
        }}
      >
        {squares.map((square) => {
          // Calculate dynamic animation delay based on number of boxes
          // Scales from dramatic (slow) for few boxes to quick for many boxes
          let delayPerBox = 1 // Default: 1ms per box (very fast for large numbers)
          
          if (lived <= 100) {
            // Years: ~80 boxes - dramatic, 30ms per box (up to 3 seconds)
            delayPerBox = 30
          } else if (lived <= 500) {
            // Months: ~960 boxes - medium speed, 3ms per box (up to 1.5 seconds)
            delayPerBox = 3
          } else if (lived <= 2000) {
            // Weeks (small): ~2000 boxes - fast, 1.5ms per box (up to 3 seconds)
            delayPerBox = 1.5
          }
          // Weeks (large): >2000 boxes - very fast, 1ms per box
          
          const delay = square.isLived && lived > 0 
            ? square.index * delayPerBox 
            : 0
          
          // Mark the first remaining (white) box as the current position
          const isCurrent = !square.isLived && square.index === lived
          
          // Calculate border thickness and glow size based on box size
          const borderThickness = Math.max(2, dimensions.squareSize * 0.08) // 8% of box size, min 2px
          const glowSize = Math.max(10, dimensions.squareSize * 0.15) // 15% of box size, min 10px
          
          return (
            <div
              key={`${square.index}-${animationKey}`}
              className={`calendar-square ${square.isLived ? 'lived' : 'remaining'} ${isCurrent ? 'current' : ''}`}
              title={`${square.isLived ? 'Lived' : 'Remaining'}`}
              style={{
                '--animation-delay': `${delay}ms`,
                '--border-thickness': `${borderThickness}px`,
                '--glow-size': `${glowSize}px`
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Calendar

