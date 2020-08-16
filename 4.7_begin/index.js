// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const Escape = require ('lodash/escape')
const Util = require('util.js')

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        
        
        const audioUrl = Util.getS3PreSignedUrl('Media/bark_converted.mp3')
        const escapedUrl = Escape(audioUrl)
        
        const speakOutput = 'Welcome to Pizza Dog! <audio src="' + escapedUrl + '"/> What can I <emphasis level="strong">get</emphasis> for you?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const DialogManagementStateInterceptor = {
    process(handlerInput) {
    
        // 1. grab the current intent
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        
        // 2. Check if the current intent is incomplete.
        if (handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.dialogState !== "COMPLETED") {
                
            console.log("Request Interceptor: INCOMPLETE INTENT request for " + currentIntent.name)
            console.log("Request Interceptor: Incoming slot values: " + JSON.stringify(currentIntent.slots))
            
            // 3. Prepare to read data saved in the session
            const attributesManager = handlerInput.attributesManager;
            const sessionAttributes = attributesManager.getSessionAttributes();
            
            // 4. Check to see if we have saved attributes for this intent
            if (sessionAttributes[currentIntent.name]) {
                
                // 5. get the saved slots
                let savedSlots = sessionAttributes[currentIntent.name].slots;
                console.log("Request Interceptor: Saved slots are " + JSON.stringify(savedSlots))
            
                // 6. restore saved slots, unless some values are being passed in.
                for (let key in savedSlots) {
                    if (!currentIntent.slots[key].value && savedSlots[key].value) {
                        console.log("Request Interceptor:  Restoring " + key + " slot with value " + savedSlots[key].value)
                        currentIntent.slots[key] = savedSlots[key];
                    }
                }    
            } else {
                console.log("Request Interceptor: there are NO saved attributes associated with " + currentIntent.name)
            }
            
            // 7. save the values of the current intent.
            sessionAttributes[currentIntent.name] = currentIntent;
            attributesManager.setSessionAttributes(sessionAttributes);
        }
        
        
    }
};

const SizeQueryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SizeQueryIntent';
    },
    handle(handlerInput) {

        
        const speakOutput = "The larger the better!  Would you like small, medium, or large?";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .addElicitSlotDirective('size',
            {
                name: "OrderPizzaIntent",
                confirmationStatus: "NONE",
                slots: {}
            })            
            .reprompt('')
            .getResponse();
    }
};


const FavoriteColorIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FavoriteColorIntent';
    },
    async handle(handlerInput) {
        
        var color = handlerInput.requestEnvelope.request.intent.slots.color.value;
        
        await handlerInput.attributesManager.setSessionAttributes({ "color" : color })
        
        
        const speakOutput = "I'll have to remember that!";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('')
            .getResponse();
    }
};


const RecallColorIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RecallColorIntent';
    },
    async handle(handlerInput) {
        
        var sessionJSON = await handlerInput.attributesManager.getSessionAttributes()
        console.log("sessionJSON " + JSON.stringify(sessionJSON))
        
        var speakOutput = "";
        
        if ( sessionJSON["color"] ) {
            speakOutput = "I hear your favorite is " + sessionJSON["color"] + "."
             return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('what is that color?')
                .getResponse();
            
        } else {
            speakOutput = "I don't know yet.  Can you tell me your favorite color?"
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .addElicitSlotDirective('color',
                {
                    name: "FavoriteColorIntent",
                    confirmationStatus: "NONE",
                    slots: {}
                })
                .reprompt('what is that color?')
                .getResponse();
            
        }
        
        

    }
};


const OrderPizzaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OrderPizzaIntent';
    },
    handle(handlerInput) {
        
        const dialogState = handlerInput.requestEnvelope.request.dialogState;
        const intent = handlerInput.requestEnvelope.request.intent;
        console.log("OrderPizzaIntentHandler: dialog state is " + dialogState)
        console.log("OrderPizzaIntentHandler: intent json is " + JSON.stringify(intent))
        
        if (dialogState !== "COMPLETED" ) {
            return handlerInput.responseBuilder
                .addDelegateDirective( intent )
                .getResponse()
        } else {
            var crust = handlerInput.requestEnvelope.request.intent.slots.crust.value;
            var topping = handlerInput.requestEnvelope.request.intent.slots.topping.value;
            var size = handlerInput.requestEnvelope.request.intent.slots.size.value;
            
            const speakOutput = 'All done.  Your order of a ' + size + ' ' + crust + ' crust pizza with ' + topping + ' should arrive in 30 minutes!';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
                .getResponse();            
        }
        

    }
};



const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!  You look great today!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        FavoriteColorIntentHandler,
        RecallColorIntentHandler,
        SizeQueryIntentHandler,
        OrderPizzaIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addRequestInterceptors(
        DialogManagementStateInterceptor
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
