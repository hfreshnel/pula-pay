import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User as UserIcon,
  Languages,
  Loader2,
  Sparkles
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = {
  français: "Français",
  fon: "Fon",
  yoruba: "Yoruba"
};

const predefinedQuestions = [
  "Comment recharger mon téléphone MTN ?",
  "Quels sont les frais de transfert ?",
  "Comment acheter un pass internet Celtiis ?",
  "Où puis-je voir mes reçus ?",
  "Comment faire un transfert CeltiisCash ?"
];

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("français");
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  /*useEffect(() => {
    loadUser();
    initializeAssistant();
  }, []);*/

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /*const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setCurrentLanguage(user.preferred_language || "français");
    } catch (error) {
      console.error("Erreur de chargement utilisateur:", error);
    }
  };*/

  const initializeAssistant = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: "assistant",
      content: "Bienvenue sur l'assistant PulaPay ! Je peux vous aider avec vos transactions, recharges et transferts. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageContent = inputMessage) => {
    if (!messageContent.trim()) return;

    /*const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const systemPrompt = `Tu es l'assistant IA de PulaPay, l'application de paiement mobile du Bénin. 
      Tu aides les utilisateurs avec:
      - Les recharges téléphoniques (MTN, Moov, Celtiis)
      - Les forfaits internet
      - Les transferts CeltiisCash
      - Le paiement de factures (SBEE, Canal+, etc.)
      - La gestion du portefeuille numérique
      
      Réponds en ${currentLanguage}. Sois helpful, précis et professionnel.
      
      Question de l'utilisateur: ${messageContent}`;

      const response = await InvokeLLM({
        prompt: systemPrompt,
        add_context_from_internet: false
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur assistant:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: "Désolé, je rencontre une erreur technique. Veuillez réessayer.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);*/
  };

  const handleLanguageChange = async (language) => {
    /*setCurrentLanguage(language);
    if (currentUser) {
      await User.updateMyUserData({ preferred_language: language });
    }*/
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-orange-500" />
              Assistant IA PulaPay
            </h1>
            <p className="text-neutral-600 monospace">
              Votre assistant multilingue pour tous vos paiements mobiles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Languages className="w-4 h-4 text-neutral-500" />
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Chat principal */}
          <div className="lg:col-span-3">
            <Card className="card-glow border-0 h-[600px] flex flex-col">
              <CardHeader className="border-b border-neutral-200/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversation
                  </CardTitle>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Bot className="w-3 h-3 mr-1" />
                    En ligne
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-auto p-0">
                <div className="p-6 space-y-4 h-full">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        message.type === 'assistant' 
                          ? 'bg-gradient-to-r from-orange-400 to-red-500' 
                          : 'bg-gradient-to-r from-neutral-400 to-neutral-500'
                      }`}>
                        {message.type === 'assistant' ? (
                          <Bot className="w-4 h-4 text-white" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                        message.type === 'user' ? 'text-right' : ''
                      }`}>
                        <div className={`rounded-2xl p-4 ${
                          message.type === 'assistant' 
                            ? 'bg-neutral-100 text-neutral-900' 
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 monospace">
                          {message.timestamp.toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-neutral-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-neutral-600">Assistant en train de réfléchir...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              
              <div className="p-6 border-t border-neutral-200/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tapez votre message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Questions prédéfinies */}
          <div>
            <Card className="card-glow border-0">
              <CardHeader>
                <CardTitle className="text-lg">Questions fréquentes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 p-6">
                  {predefinedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 text-sm hover:bg-neutral-100"
                      onClick={() => handleSendMessage(question)}
                      disabled={isLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}