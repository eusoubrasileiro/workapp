


const waitForSelector = (
    selector: string,
    state: "attached" | "detached",
    timeout: number
  ): Promise<Element | null> => {
    return new Promise((resolve, reject) => {
      const start = Date.now()

      const check = () => {
        const el = document.querySelector(selector)
        const elapsed = Date.now() - start

        if (state === "attached" && el) return resolve(el)
        if (state === "detached" && !el) return resolve(null)
        if (elapsed >= timeout)
          return reject(
            new Error(
              `Timeout waiting for selector "${selector}" to be ${state}`
            )
          )
        requestAnimationFrame(check)
      }

      check()
    })
}

const waitForUrlChange = (timeout: number = Infinity): Promise<string> => {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const initialUrl = window.location.href
      const interval = setInterval(() => {
        const currentUrl = window.location.href
        const elapsed = Date.now() - start
  
        if (currentUrl !== initialUrl) {
          clearInterval(interval)
          resolve(currentUrl)
        }
  
        if (elapsed >= timeout) {
          clearInterval(interval)
          reject(new Error(`Timeout waiting for URL to change from ${initialUrl}`))
        }
      }, 750) // ✅ Polling every 250ms is faster + still light
    })
  }


const click = (selector: string, timeout: number = 1000, sleep: number = 0): Promise<Element | null> => {
    return new Promise((resolve, reject) => {
        const start = Date.now()
        
        const checkAndClick = () => {
            const el = document.querySelector(selector)
            const elapsed = Date.now() - start
            
            if (el) {
                // Element found, now wait for sleep milliseconds before clicking
                setTimeout(() => {
                    try {
                        (el as HTMLElement).click()
                        resolve(el)
                    } catch (error) {
                        reject(new Error(`Failed to click element: ${error}`))
                    }
                }, sleep)
                return
            }
            
            if (elapsed >= timeout) {
                reject(new Error(`Timeout waiting for element: ${selector}`))
                return
            }
            
            // Continue checking
            requestAnimationFrame(checkAndClick)
        }
        
        checkAndClick()
    })
}
export { waitForSelector, waitForUrlChange, click }