import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Star, Phone, Mail, Edit, Trash2, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    contact_name: "",
    phone_number: "",
    email: "",
    mobile_money_provider: "MTN",
    mobile_money_phone: "",
    bank_name: "",
    account_number: "",
    notes: ""
  });

  /*useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery]);*/

  /*const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const userContacts = await Contact.filter({ user_id: user.email }, "-last_transaction_date");
      setContacts(userContacts);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  };*/

  const filterContacts = () => {
    /*if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => 
      contact.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone_number?.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContacts(filtered);*/
  };

  const resetForm = () => {
    setFormData({
      contact_name: "",
      phone_number: "",
      email: "",
      mobile_money_provider: "MTN",
      mobile_money_phone: "",
      bank_name: "",
      account_number: "",
      notes: ""
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingContact(null);
    setShowAddModal(true);
  };

  const openEditModal = (contact) => {
    setFormData({
      contact_name: contact.contact_name || "",
      phone_number: contact.phone_number || "",
      email: contact.email || "",
      mobile_money_provider: contact.mobile_money_accounts?.[0]?.provider || "MTN",
      mobile_money_phone: contact.mobile_money_accounts?.[0]?.phone_number || "",
      bank_name: contact.bank_info?.bank_name || "",
      account_number: contact.bank_info?.account_number || "",
      notes: contact.notes || ""
    });
    setEditingContact(contact);
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const contactData = {
      user_id: currentUser.email,
      contact_name: formData.contact_name,
      phone_number: formData.phone_number,
      email: formData.email || undefined,
      mobile_money_accounts: formData.mobile_money_phone ? [{
        provider: formData.mobile_money_provider,
        phone_number: formData.mobile_money_phone,
        account_name: formData.contact_name
      }] : [],
      bank_info: formData.bank_name ? {
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        account_type: "savings"
      } : undefined,
      notes: formData.notes || undefined,
      is_favorite: false,
      total_sent: 0,
      transaction_count: 0
    };

    /*try {
      if (editingContact) {
        await Contact.update(editingContact.id, contactData);
      } else {
        await Contact.create(contactData);
      }
      
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }*/
  };

  const deleteContact = async (contact) => {
    /*if (confirm(`Supprimer le contact ${contact.contact_name} ?`)) {
      try {
        await Contact.delete(contact.id);
        loadData();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }*/
  };

  const toggleFavorite = async (contact) => {
    /*try {
      await Contact.update(contact.id, { 
        ...contact, 
        is_favorite: !contact.is_favorite 
      });
      loadData();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }*/
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement des contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Contacts</h1>
            <p className="text-neutral-600">Gérez vos contacts de paiement</p>
          </div>
          <Button onClick={openAddModal} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau contact
          </Button>
        </div>

        {/* Search */}
        <Card className="card-glow border-0">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Rechercher un contact..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacts favoris */}
        {contacts.filter(c => c.is_favorite).length > 0 && (
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Contacts favoris
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {contacts.filter(c => c.is_favorite).slice(0, 6).map(contact => (
                  <div key={contact.id} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-semibold text-lg">
                        {contact.contact_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {contact.contact_name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {contact.phone_number}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des contacts */}
        <Card className="card-glow border-0">
          <CardHeader>
            <CardTitle>Tous les contacts ({filteredContacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {searchQuery ? "Aucun contact trouvé" : "Aucun contact"}
                </h3>
                <p className="text-neutral-500 mb-4">
                  {searchQuery ? "Essayez un autre terme de recherche" : "Ajoutez vos premiers contacts de paiement"}
                </p>
                {!searchQuery && (
                  <Button onClick={openAddModal} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un contact
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {contact.contact_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900">{contact.contact_name}</h3>
                          {contact.is_favorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone_number}
                          </span>
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </span>
                          )}
                        </div>
                        {contact.mobile_money_accounts?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {contact.mobile_money_accounts.map((acc, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {acc.provider}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(contact)}
                        className="text-neutral-400 hover:text-yellow-500"
                      >
                        <Star className={`w-4 h-4 ${contact.is_favorite ? 'fill-current text-yellow-500' : ''}`} />
                      </Button>
                      <Link to={createPageUrl("P2PTransfer") + `?contact=${contact.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-neutral-400 hover:text-emerald-500"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(contact)}
                        className="text-neutral-400 hover:text-blue-500"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteContact(contact)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Ajouter/Modifier */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "Modifier le contact" : "Nouveau contact"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label>Nom complet *</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Téléphone *</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Mobile Money</Label>
                  <Select 
                    value={formData.mobile_money_provider} 
                    onValueChange={(value) => setFormData({...formData, mobile_money_provider: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN">MTN</SelectItem>
                      <SelectItem value="Moov">Moov</SelectItem>
                      <SelectItem value="Celtiis">Celtiis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Numéro MoMo</Label>
                  <Input
                    value={formData.mobile_money_phone}
                    onChange={(e) => setFormData({...formData, mobile_money_phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Banque</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Numéro de compte</Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  {editingContact ? "Enregistrer" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}