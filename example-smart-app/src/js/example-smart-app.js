(function (window) {
  window.extractData = function () {
    const ret = $.Deferred()

    function onError () {
      console.log('Loading error', arguments)
      ret.reject()
    }

    function onReady (smart) {
      if (smart.hasOwnProperty('patient')) {
        const patient = smart.patient
        const pt = patient.read()
        const obv = smart.patient.api.fetchAll({
          type: 'Observation',
          query: {
            code: {
              $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
            }
          }
        })

        $.when(pt, obv).fail(onError)

        $.when(pt, obv).done(function (patient, obv) {
          const byCodes = smart.byCodes(obv, 'code')
          const gender = patient.gender

          let fname = ''
          let lname = ''

          if (typeof patient.name[0] !== 'undefined') {
            console.log(patient.name)
            fname = patient.name[0].given.join(' ')
            lname = patient.name[0].family.join(' ')
          }

          const height = byCodes('8302-2')
          const systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6')
          const diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4')
          const hdl = byCodes('2085-9')
          const ldl = byCodes('2089-1')

          const p = defaultPatient()
          p.birthdate = patient.birthDate
          p.gender = gender
          p.fname = fname
          p.lname = lname
          p.height = getQuantityValueAndUnit(height[0])

          if (typeof systolicbp !== 'undefined') {
            p.systolicbp = systolicbp
          }

          if (typeof diastolicbp !== 'undefined') {
            p.diastolicbp = diastolicbp
          }

          p.hdl = getQuantityValueAndUnit(hdl[0])
          p.ldl = getQuantityValueAndUnit(ldl[0])

          ret.resolve(p)
        })
      } else {
        onError()
      }
    }

    FHIR.oauth2.ready(onReady, onError)
    return ret.promise()
  }

  function defaultPatient () {
    return {
      fname: { value: '' },
      lname: { value: '' },
      gender: { value: '' },
      birthdate: { value: '' },
      height: { value: '' },
      systolicbp: { value: '' },
      diastolicbp: { value: '' },
      ldl: { value: '' },
      hdl: { value: '' }
    }
  }

  function getBloodPressureValue (BPObservations, typeOfPressure) {
    const formattedBPObservations = []
    BPObservations.forEach(function (observation) {
      const BP = observation.component.find(function (component) {
        return component.code.coding.find(function (coding) {
          return coding.code == typeOfPressure
        })
      })
      if (BP) {
        observation.valueQuantity = BP.valueQuantity
        formattedBPObservations.push(observation)
      }
    })

    return getQuantityValueAndUnit(formattedBPObservations[0])
  }

  function getQuantityValueAndUnit (ob) {
    if (typeof ob !== 'undefined' &&
        typeof ob.valueQuantity !== 'undefined' &&
        typeof ob.valueQuantity.value !== 'undefined' &&
        typeof ob.valueQuantity.unit !== 'undefined') {
      return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit
    } else {
      return undefined
    }
  }

  window.drawVisualization = function (p) {
    $('#holder').show()
    $('#loading').hide()
    $('#fname').html(p.fname)
    $('#lname').html(p.lname)
    $('#gender').html(p.gender)
    $('#birthdate').html(p.birthdate)
    $('#height').html(p.height)
    $('#systolicbp').html(p.systolicbp)
    $('#diastolicbp').html(p.diastolicbp)
    $('#ldl').html(p.ldl)
    $('#hdl').html(p.hdl)
  }
})(window)
