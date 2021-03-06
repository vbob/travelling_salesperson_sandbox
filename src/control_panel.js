/* eslint-disable max-statements */
/* eslint-disable no-eval */
/*
 * travelling_salesperson_sandbox
 * https://github.com/vbob/travelling_salesperson_sandbox
 * 
 * Copyright (c) 2018 Vitor Barth
 * Licensed under the MIT License
 * 
 */

import {
    AlgorithmManager
} from "./algorithms";

import {
    fromEvent
} from 'rxjs'
import {
    City
} from "./city";
import {
    StatsManager
} from "./stats";

let _self;

function verifyBorders(a1, a2) {
    if (a1 < (0 + _self.grid.cityRadius))
        return 0 + _self.grid.cityRadius
    else if ((a1 > (a2 - _self.grid.cityRadius)))
        return a2 - _self.grid.cityRadius
    else return a1
}
class ControlPanel {
    constructor(selectors, grid) {
        _self = this
        this.grid = grid

        this.algorithmManager = new AlgorithmManager(this.grid.citiesArray)

        this.defineSelectors(selectors)
    }

    initialize() {
        this.hideHeuristicsMenu()
        this.importAlgorithms()
        this.importHeuristics()
        this.startListeners()
        this.createCities()
    }

    defineSelectors(selectors) {
        this.algorithmSelector = document.querySelector(selectors.algorithmSelector)
        this.heuristicsContainerSelector = document.querySelector(selectors.heuristicsContainerSelector)
        this.heuristicsSelector = document.querySelector(selectors.heuristicsSelector)
        this.playButtonSelector = document.querySelector(selectors.playButtonSelector)
        this.pauseButtonSelector = document.querySelector(selectors.pauseButtonSelector)
        this.stopButtonSelector = document.querySelector(selectors.stopButtonSelector)
        this.forwardButtonSelector = document.querySelector(selectors.forwardButtonSelector)
        this.backwardButtonSelector = document.querySelector(selectors.backwardButtonSelector)
        this.saveButtonSelector = document.querySelector(selectors.saveButtonSelector)
        this.citiesQttySelector = document.querySelector(selectors.citiesQttySelector)
    }

    importAlgorithms() {
        for (let i = 0; i < this.algorithmSelector.length; i++)
            this.algorithmSelector[i] = null

        let newOption = document.createElement('option')
        newOption.value = null
        this.algorithmSelector.add(newOption)

        for (let algorithm in this.algorithmManager.algorithmList) {
            if (this.algorithmManager.algorithmList[algorithm].id && this.algorithmManager.algorithmList[algorithm].displayName) {
                let newOption = document.createElement('option')
                newOption.text = this.algorithmManager.algorithmList[algorithm].displayName
                newOption.value = this.algorithmManager.algorithmList[algorithm].id
                this.algorithmSelector.add(newOption)
            }
        }
    }

    importHeuristics() {
        for (let i = 0; i < this.heuristicsSelector.length; i++)
            this.heuristicsSelector[i] = null

        let newOption = document.createElement('option')
        newOption.text = ''
        newOption.value = null
        this.heuristicsSelector.add(newOption)

        for (let heuristic in this.algorithmManager.heuristicsList) {
            if (this.algorithmManager.heuristicsList[heuristic].id && this.algorithmManager.heuristicsList[heuristic].displayName) {
                let newOption = document.createElement('option')
                newOption.text = this.algorithmManager.heuristicsList[heuristic].displayName
                newOption.value = this.algorithmManager.heuristicsList[heuristic].id
                this.heuristicsSelector.add(newOption)
            }
        }
    }

    startListeners() {
        // fromEvent(this.saveButtonSelector, 'click').subscribe(this.save)
        // fromEvent(this.backwardButtonSelector, 'click').subscribe(this.algorithmManager.backward)


        fromEvent(this.citiesQttySelector, 'change').subscribe(this.updateCitiesMap)
        fromEvent(this.playButtonSelector, 'click').subscribe(this.algorithmManager.play)
        fromEvent(this.pauseButtonSelector, 'click').subscribe(this.algorithmManager.pause)
        fromEvent(this.stopButtonSelector, 'click').subscribe(this.algorithmManager.stop)
        fromEvent(this.forwardButtonSelector, 'click').subscribe(this.algorithmManager.forward)
        fromEvent(this.algorithmSelector, 'change').subscribe(this.changeAlgorithm)
        fromEvent(this.heuristicsSelector, 'change').subscribe(this.changeHeuristics)

        this.algorithmManager.statusAnnounce$.subscribe(this.statusUpdate)
        this.algorithmManager.currentNodeAnnounce$.subscribe(this.changeNode)
        this.algorithmManager.stepAnnounce$.subscribe(this.updateStep)

        this.startStatsManager()

        this.disableButton('stop')
        this.disableButton('play')
        this.disableButton('pause')
        this.disableButton('forward')
    }

    save() {
        //ToBeImplemented
    }

    changeAlgorithm() {
        let selectedAlgorithm = _self.algorithmSelector.value
        _self.algorithmManager.changeAlgorithm(selectedAlgorithm)

        if (_self.algorithmManager.validAlgorithmSelected()) {
            if (_self.algorithmManager.algorithmList[selectedAlgorithm].useHeuristics)
                _self.showHeuristicsMenu()
            else {
                _self.hideHeuristicsMenu()
                _self.enableButton('play')
                _self.enableButton('forward')
            }
        } else {
            _self.disableButton('stop')
            _self.disableButton('play')
            _self.disableButton('pause')
            _self.disableButton('forward')
            _self.hideHeuristicsMenu()
        }
    }

    changeHeuristics() {
        let selectedHeuristics = _self.heuristicsSelector.value
        _self.algorithmManager.changeHeuristics(selectedHeuristics)

        if (_self.algorithmManager.validHeuristicsSelected()) {
            _self.enableButton('play')
            _self.enableButton('forward')
        } else {
            _self.disableButton('stop')
            _self.disableButton('play')
            _self.disableButton('pause')
            _self.disableButton('forward')
        }
    }

    hideHeuristicsMenu() {
        _self.heuristicsContainerSelector.classList.add('d-none')
    }

    showHeuristicsMenu() {
        _self.heuristicsContainerSelector.classList.remove('d-none')

        if (_self.algorithmManager.validHeuristicsSelected()) {
            _self.enableButton('play')
            _self.enableButton('forward')
        } else {
            _self.disableButton('stop')
            _self.disableButton('play')
            _self.disableButton('pause')
            _self.disableButton('forward')
        }
    }

    createCities() {
        let numCities = _self.citiesQttySelector.value

        this.pushRandomCities(numCities)
    }


    updateCitiesMap() {
        _self.algorithmManager.stop()

        if (_self.citiesQttySelector.value > 3 && _self.citiesQttySelector.value < 21) {
            let numCities = _self.citiesQttySelector.value

            if (numCities > _self.grid.citiesArray.length)
                _self.pushRandomCities(numCities - _self.grid.citiesArray.length)

            else if (numCities < _self.grid.citiesArray.length) {
                let toBeRemoved = _self.grid.citiesArray.length - numCities

                for (let i = 0; i < toBeRemoved; i++) {
                    _self.grid.removeCity(_self.grid.citiesArray[_self.grid.citiesArray.length - 1])
                }
            }
        }
    }

    startStatsManager() {
        let selectorsStats = {
            longestPathSelector: '#longest_path',
            memoryUsageSelector: '#ram_usage',
            runSpeedSelector: '#exec_speed',
            currentPathSelector: '#current_path',
            statusSelector: '#status',
            stepNumberSelector: '#step_number',
            timeElapsedSelector: '#time_elapsed'
        }

        //_self.stats.changeProperty('runSpeed', '0')
        this.stats = new StatsManager(selectorsStats)
        this.stats.updateStats()
    }

    updateStep({
        stepNumber,
        numberOfNodes,
        timeElapsed,
        currentPath
    }) {
        _self.stats.changeProperty('stepNumber', stepNumber)
        _self.stats.changeProperty('memoryUsage', numberOfNodes)
        _self.stats.changeProperty('timeElapsed', timeElapsed)
        _self.stats.changeProperty('currentPath', currentPath)
    }

    disableButton(button) {
        eval(`_self.${button}ButtonSelector.disabled = true`)
    }

    enableButton(button) {
        eval(`_self.${button}ButtonSelector.disabled = false`)
    }

    statusUpdate(status) {

        if (status == 'running')
            _self.run()
        else if (status == 'paused')
            _self.pause()
        else if (status == 'stopped')
            _self.stop()
        else if (status == 'ended')
            _self.end()

    }

    run() {
        //_self.stats.changeProperty('runSpeed', '100')
        _self.stats.changeProperty('status', 'Executando')

        _self.disableAllButtons()

        if (_self.algorithmManager.validAlgorithmSelected()) {
            _self.enableButton('stop')
            _self.enableButton('pause')

            _self.disableButton('play')
            _self.disableButton('forward')
        }

        _self.grid.disableDrag();
    }

    pause() {
        //_self.stats.changeProperty('runSpeed', '0')
        _self.stats.changeProperty('status', 'Pausado')

        _self.disableAllButtons()

        if (_self.algorithmManager.validAlgorithmSelected()) {
            _self.enableButton('play')
            _self.enableButton('forward')
            _self.enableButton('stop')
        }

        _self.grid.disableDrag();
    }

    stop() {
        //_self.stats.changeProperty('runSpeed', '0')
        _self.stats.changeProperty('status', 'Parado')

        _self.disableAllButtons()

        if (_self.algorithmManager.validAlgorithmSelected()) {
            _self.enableButton('play')
            _self.enableButton('forward')
        }

        _self.grid.enableDrag();
        _self.grid.deleteConnections();
        _self.grid.clearCurrent()
        _self.startStatsManager()
    }

    end() {
        //_self.stats.changeProperty('runSpeed', '0')
        _self.stats.changeProperty('status', 'Finalizado')

        _self.disableAllButtons()

        if (_self.algorithmManager.validAlgorithmSelected()) {
            _self.enableButton('stop')
        }

        _self.grid.clearCurrent()
        _self.grid.disableDrag();
    }

    disableAllButtons() {
        _self.disableButton('play')
        _self.disableButton('pause')
        _self.disableButton('stop')
        _self.disableButton('forward')
    }

    changeNode(node) {
        
        _self.grid.markCurrent(node.state)
        _self.grid.deleteConnections()

        let sol = _self.algorithmManager.problem.solution(node)

        for (let city in sol) {
            if (city > 0)
                _self.grid.drawConnection(sol[city - 1], sol[city])
        }

        if (_self.algorithmManager.problem.goalTest(node))
            _self.grid.drawConnection(sol[sol.length - 1], _self.algorithmManager.problem.initialState)

    }

    pushRandomCities(numCities) {
        let rndmX, rndmY;

        for (let i = 0; i < numCities; i++) {
            rndmX = Math.random() * (_self.grid.width - _self.grid.cityRadius)
            rndmY = Math.random() * (_self.grid.height - _self.grid.cityRadius)

            _self.grid.addCity(new City({
                id: _self.grid.citiesArray.length + 1,
                x: verifyBorders(rndmX, _self.grid.width),
                y: verifyBorders(rndmY, _self.grid.height)
            }))
        }
    }
}

export {
    ControlPanel
}