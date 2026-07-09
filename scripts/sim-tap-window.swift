import AppKit
import CoreGraphics
import Foundation

let args = CommandLine.arguments
guard args.count == 3,
      let relX = Double(args[1]),
      let relY = Double(args[2]) else {
  fputs("usage: sim-tap-window.swift <device-x> <device-y>\n", stderr)
  exit(1)
}

NSRunningApplication.runningApplications(withBundleIdentifier: "com.apple.iphonesimulator").first?
  .activate(options: [.activateIgnoringOtherApps])
usleep(350_000)

let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
guard let windowList = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
  fputs("unable to list windows\n", stderr)
  exit(1)
}

let simWindow = windowList.first { info in
  (info[kCGWindowOwnerName as String] as? String) == "Simulator" &&
    (info[kCGWindowLayer as String] as? Int) == 0 &&
    ((info[kCGWindowBounds as String] as? [String: CGFloat])?["Width"] ?? 0) > 300
}

guard let bounds = simWindow?[kCGWindowBounds as String] as? [String: CGFloat],
      let winX = bounds["X"], let winY = bounds["Y"],
      let winW = bounds["Width"], let winH = bounds["Height"] else {
  fputs("unable to find Simulator window bounds\n", stderr)
  exit(1)
}

// iPhone logical viewport inside Simulator chrome (title bar + side bezels).
let chromeTop: CGFloat = 39
let chromeBottom: CGFloat = 28
let chromeSide: CGFloat = 32
let deviceW: CGFloat = 393
let deviceH: CGFloat = 852
let scaleX = (winW - chromeSide * 2) / deviceW
let scaleY = (winH - chromeTop - chromeBottom) / deviceH

let point = CGPoint(
  x: winX + chromeSide + CGFloat(relX) * scaleX,
  y: winY + chromeTop + CGFloat(relY) * scaleY
)

let down = CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left)!
let up = CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left)!
down.post(tap: .cghidEventTap)
usleep(150_000)
up.post(tap: .cghidEventTap)
print(String(format: "tapped screen %.0f,%.0f (device %.0f,%.0f)", point.x, point.y, relX, relY))