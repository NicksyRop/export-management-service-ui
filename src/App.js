import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Layout, Menu, Card, Table, Button, Form, Input, InputNumber, Select, 
  Modal, Tag, Space, Statistic, Row, Col, message, Tabs, Avatar, 
  Dropdown, Badge, DatePicker, Descriptions, Drawer, Upload, Switch,
  Divider, Typography, Alert, Radio, Checkbox, Popconfirm, Spin, List
} from 'antd';
import {
  ShoppingCartOutlined, ExportOutlined, UserOutlined, AppstoreOutlined,
  DollarOutlined, LogoutOutlined, SettingOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, SearchOutlined, FileTextOutlined,
  BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, SyncOutlined, LockOutlined,ShoppingOutlined
} from '@ant-design/icons';
import { jwtDecode } from "jwt-decode";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;


const UNIT_OF_MEASURE = [
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'G', label: 'Gram (G)' },
  { value: 'L', label: 'Litre (L)' },
  { value: 'ML', label: 'Millilitre (ML)' },
  { value: 'PIECE', label: 'Piece' },
  { value: 'PACK', label: 'Pack' }
];

// ==================== CONTEXT & STATE MANAGEMENT ====================

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Theme Context
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// ==================== API SERVICE ====================

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:9051/api/management-service';
    this.token = localStorage.getItem('token');
  }


  decodeJWT(token) {
  try {
   const decoded = jwtDecode(token);
   return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

 async request(endpoint, options = {}) {
  const url = `${this.baseURL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(this.token && { Authorization: `Bearer ${this.token}` }),
    ...options.headers
  };

  try {
    console.log('[API REQUEST]', {
      method: options.method || 'GET',
      url,
      headers,
      body: options.body
    });

    const response = await fetch(url, {
      ...options,
      headers
    });

    const responseText = await response.text();

    console.log('[API RESPONSE]', {
      url,
      status: response.status,
      ok: response.ok,
      body: responseText
    });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      let errorMessage = 'Request failed';

      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorMessage;
      } catch (_) {
        errorMessage = responseText;
      }

      throw new Error(errorMessage);
    }

    return responseText ? JSON.parse(responseText) : null;

  } catch (error) {
    console.error('[API ERROR]', {
      url,
      message: error.message
    });
    throw error;
  }
}


  // Auth endpoints
  async login(username, password) {
  const data = await this.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  this.setToken(data.token);
  
  // Decode JWT to extract user info
  const decodedToken = this.decodeJWT(data.token);
  console.log('Decoded JWT:', decodedToken);
  
  // Create user object from JWT
  const user = {
    id: decodedToken.identifier,
    username: decodedToken.sub,
    role: decodedToken.type || 'USER',
    permissions: decodedToken.permissions || []
  };
  
  // Return complete response with user
  return {
    token: data.token,
    expiresIn: data.expiresIn,
    user: user
  };
}

  async logout() {
    this.setToken(null);
  }

  //build filters 
  buildQueryParams(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, value);
    }
  });

  return query.toString();
}


  // Products
  async getProducts(filters = {}) {
    const query = this.buildQueryParams(filters);
    const endpoint = query ? `/products?${query}` : '/products';

    return this.request(endpoint, {
    method: 'GET'
  });
  }

 // Countries
    async getCountries() {
    return this.request("/configurations/countries", {
    method: 'GET'
  });
  }

   // Categories
  async getCategories() {
    return this.request("/categories", {
    method: 'GET'
  });
  }


  async searchProducts(text){
    const query = this.buildQueryParams({
      
    });
    const endpoint = query ? `/products?${query}` : '/products';
    return this.request(endpoint), {
      method: 'GET'
    }
  }

  async createProduct(product) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  }

  async updateProduct(id, product) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Sales
  async getSales() {
    return this.request('/sales');
  }

  async createSale(sale) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale)
    });
  }

  // Exports/Consignments
  async getConsignments(filters = {}) {
     const query = this.buildQueryParams(filters);
     const endpoint = query ? `/consignments?${query}` : '/consignments';
    return this.request(endpoint);
  }

  async updateConsignmentStatus(id, status) {
    return this.request(`/consignments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Users
  async getUsers(filters = {}) {
    const query = this.buildQueryParams(filters);
    const endpoint = query ? `/users?${query}` : '/users';
    
      return this.request(endpoint, {
      method: 'GET'
    });
  }

  async createUser(user) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  async updateUser(id, user) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  }

  // Accounting
  async getTransactions() {
    return this.request('/accounting/transactions');
  }

  async createTransaction(transaction) {
    return this.request('/accounting/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  }
}

const api = new ApiService();

// ==================== LOGIN PAGE ====================

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const data = await api.login(values.username, values.password);
      message.success('Login successful!');
      onLogin(data.user);
    } catch (error) {
      message.error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${theme.primaryColor}15 0%, ${theme.primaryColor}05 100%)`,
      fontFamily: '"Outfit", sans-serif'
    }}>
      <Card 
        style={{ 
          width: 450, 
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          borderRadius: 16,
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingCartOutlined style={{ fontSize: 40, color: 'white' }} />
          </div>
          <Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>Welcome Back</Title>
          <Text type="secondary" style={{ fontSize: 15 }}>Sign in to your account</Text>
        </div>

        <Form
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              style={{ 
                height: 48, 
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                border: 'none'
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

// ==================== SALES / POS MODULE ====================

const SalesModule = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts(
        {
        page: 1,
        size: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      }
      );
    
      setProducts(data.content);
      console.log("products list")
      console.log(data.content);
      
    } catch (error) {
      message.error('Failed to load products');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    message.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.warning('Cart is empty');
      return;
    }

    try {
      const sale = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: calculateTotal(),
        date: new Date().toISOString()
      };

      const invoice = await api.createSale(sale);
      setCurrentInvoice({ ...sale, invoiceNumber: invoice.id, items: cart });
      setInvoiceVisible(true);
      setCart([]);
      message.success('Sale completed successfully!');
    } catch (error) {
      message.error('Failed to complete sale');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Row gutter={24}>
        <Col span={16}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: theme.primaryColor }} />
                <span>Products</span>
              </Space>
            }
            extra={
              <Input
                placeholder="Search products..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 250 }}
              />
            }
            style={{ borderRadius: 12 }}
          >
            <Row gutter={[16, 16]}>
              {filteredProducts.map(product => (
                <Col span={6} key={product.id}>
                  <Card
                    hoverable
                    onClick={() => addToCart(product)}
                    style={{ 
                      borderRadius: 12,
                      border: `2px solid ${theme.primaryColor}20`,
                      transition: 'all 0.3s ease'
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{
                      width: '100%',
                      height: 120,
                      background: `linear-gradient(135deg, ${theme.primaryColor}10 0%, ${theme.secondaryColor}10 100%)`,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12
                    }}>
                      <AppstoreOutlined style={{ fontSize: 48, color: theme.primaryColor }} />
                    </div>
                    <Title level={5} style={{ marginBottom: 4 }}>{product.name}</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>SKU: {product.sku}</Text>
                    <div style={{ marginTop: 12 }}>
                      <Text strong style={{ fontSize: 18, color: theme.primaryColor }}>
                        ${product.price?.toFixed(2)}
                      </Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Tag color={product.stock > 10 ? 'success' : 'warning'}>
                        Stock: {product.stock}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title={
              <Space>
                <Badge count={cart.length} offset={[10, 0]}>
                  <ShoppingCartOutlined style={{ fontSize: 20, color: theme.primaryColor }} />
                </Badge>
                <span>Cart</span>
              </Space>
            }
            style={{ borderRadius: 12, position: 'sticky', top: 24 }}
          >
            <div style={{ minHeight: 400, maxHeight: 500, overflow: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                  <ShoppingCartOutlined style={{ fontSize: 60, marginBottom: 16 }} />
                  <div>Your cart is empty</div>
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {cart.map(item => (
                    <Card 
                      key={item.id} 
                      size="small" 
                      style={{ borderRadius: 8 }}
                    >
                      <Row align="middle" gutter={8}>
                        <Col flex="auto">
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ color: theme.primaryColor, fontWeight: 600 }}>
                            ${item.price.toFixed(2)}
                          </div>
                        </Col>
                        <Col>
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(val) => updateQuantity(item.id, val)}
                            style={{ width: 70 }}
                          />
                        </Col>
                        <Col>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => removeFromCart(item.id)}
                          />
                        </Col>
                      </Row>
                      <div style={{ marginTop: 8, textAlign: 'right', fontWeight: 600 }}>
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Row justify="space-between" style={{ fontSize: 18, fontWeight: 700 }}>
                <Col>Total:</Col>
                <Col style={{ color: theme.primaryColor }}>
                  ${calculateTotal().toFixed(2)}
                </Col>
              </Row>
            </div>

            <Button
              type="primary"
              block
              size="large"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              style={{ 
                height: 50,
                borderRadius: 8,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                border: 'none'
              }}
            >
              Checkout
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Invoice Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: theme.primaryColor }} />
            <span>Invoice</span>
          </Space>
        }
        open={invoiceVisible}
        onCancel={() => setInvoiceVisible(false)}
        footer={[
          <Button key="print" type="primary" style={{ background: theme.primaryColor }}>
            Print Invoice
          </Button>,
          <Button key="close" onClick={() => setInvoiceVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {currentInvoice && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Invoice #" span={2}>
                {currentInvoice.invoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Date" span={2}>
                {new Date(currentInvoice.date).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Table
              dataSource={currentInvoice.items}
              columns={[
                { title: 'Product', dataIndex: 'name', key: 'name' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => `$${val.toFixed(2)}` },
                { 
                  title: 'Total', 
                  key: 'total', 
                  render: (_, record) => `$${(record.price * record.quantity).toFixed(2)}` 
                }
              ]}
              pagination={false}
              style={{ marginTop: 16 }}
              summary={() => (
                <Table.Summary.Row style={{ background: '#fafafa' }}>
                  <Table.Summary.Cell colSpan={3} align="right">
                    <strong>Total Amount:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell>
                    <strong style={{ color: theme.primaryColor }}>
                      ${currentInvoice.total.toFixed(2)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==================== EXPORTS MODULE ====================

const ExportsModule = () => {
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { theme } = useTheme();

  // Form state
  const [suppliers, setSuppliers] = useState([]);
  const [searchingSuppliers, setSearchingSuppliers] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    loadConsignments(1, 10);
    loadCountries();
  }, []);

  const loadConsignments = async (page = 1, size = 10, status = null) => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };
      if (status) {
        params.status = status;
      }
      
      const response = await api.getConsignments(params);
      setConsignments(response.content || response.data || response);
      setPagination({
        current: page,
        pageSize: size,
        total: response.totalElements || response.total || response.length
      });
    } catch (error) {
      message.error('Failed to load consignments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      const data = await api.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  };

  const searchSuppliers = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setSuppliers([]);
      return;
    }

    setSearchingSuppliers(true);
    try {
      const data = await api.searchUsers(searchText);
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to search suppliers:', error);
      message.error('Failed to search suppliers');
    } finally {
      setSearchingSuppliers(false);
    }
  };

  const searchProducts = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setProducts([]);
      return;
    }

    setSearchingProducts(true);
    try {
      const data = await api.searchProducts(searchText);
      setProducts(data);
    } catch (error) {
      console.error('Failed to search products:', error);
      message.error('Failed to search products');
    } finally {
      setSearchingProducts(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.updateConsignmentStatus(id, status);
      message.success('Status updated successfully');
      loadConsignments(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleAddProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const exists = selectedProducts.find(p => p.productId === productId);
    if (exists) {
      message.warning('Product already added');
      return;
    }

    setSelectedProducts([...selectedProducts, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitOfMeasure: 'KG'
    }]);
  };

  const handleUpdateProduct = (productId, field, value) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.productId === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const handleSubmitConsignment = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedProducts.length === 0) {
        message.error('Please add at least one product');
        return;
      }

      setSubmitting(true);

      const payload = {
        products: selectedProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unitOfMeasure: p.unitOfMeasure
        })),
        countryId: values.countryId,
        purpose: 'EXPORT',
        userId: values.userId
      };

      await api.createConsignment(payload);
      message.success('Consignment created successfully');
      
      // Reset form
      form.resetFields();
      setSelectedProducts([]);
      setModalVisible(false);
      
      // Reload consignments
      loadConsignments(1, pagination.pageSize);
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error('Failed to create consignment');
        console.error(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTableChange = (newPagination) => {
    loadConsignments(newPagination.current, newPagination.pageSize);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      RECEIVED: { color: 'blue', icon: <CheckCircleOutlined /> },
      PROCESSING: { color: 'orange', icon: <SyncOutlined spin /> },
      EXPORTED: { color: 'green', icon: <CheckCircleOutlined /> },
      PENDING: { color: 'default', icon: <ClockCircleOutlined /> },
      ACKNOWLEDGED: { color: 'cyan', icon: <CheckCircleOutlined /> },
      CANCELLED: { color: 'red', icon: <CloseCircleOutlined /> }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
  };

  const columns = [
    {
      title: 'Consignment ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text strong>{text.substring(0, 8)}...</Text>
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier) => (
        <Space>
          <Avatar style={{ backgroundColor: theme.primaryColor }}>
            {supplier?.name?.charAt(0) || 'U'}
          </Avatar>
          <div>
            <div>{supplier?.name || 'N/A'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{supplier?.email || ''}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => <Tag>{items?.length || 0} items</Tag>
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => <Text strong style={{ color: theme.primaryColor }}>${value?.toFixed(2) || '0.00'}</Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedConsignment(record);
              setDrawerVisible(true);
            }}
          >
            View
          </Button>
          {record.status !== 'EXPORTED' && (
            <Dropdown
              menu={{
                items: [
                  { key: 'RECEIVED', label: 'Mark as Received' },
                  { key: 'PROCESSING', label: 'Mark as Processing' },
                  { key: 'EXPORTED', label: 'Mark as Exported' },
                  { key: 'CANCELLED', label: 'Cancel', danger: true }
                ],
                onClick: ({ key }) => updateStatus(record.id, key)
              }}
            >
              <Button type="link">Change Status</Button>
            </Dropdown>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card 
        title={
          <Space>
            <ExportOutlined style={{ color: theme.primaryColor }} />
            <span>Export Consignments</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            style={{ background: theme.primaryColor }}
            onClick={() => setModalVisible(true)}
          >
            New Consignment
          </Button>
        }
        style={{ borderRadius: 12 }}
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: `${theme.primaryColor}10` }}>
              <Statistic
                title="Total Consignments"
                value={pagination.total}
                prefix={<ExportOutlined />}
                valueStyle={{ color: theme.primaryColor }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: '#1890ff10' }}>
              <Statistic
                title="Received"
                value={consignments.filter(c => c.status === 'RECEIVED').length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: '#52c41a10' }}>
              <Statistic
                title="Exported"
                value={consignments.filter(c => c.status === 'EXPORTED').length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: '#faad1410' }}>
              <Statistic
                title="Processing"
                value={consignments.filter(c => c.status === 'PROCESSING').length}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={consignments}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Consignment Details Drawer */}
      <Drawer
        title="Consignment Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        {selectedConsignment && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Consignment ID">
                {selectedConsignment.id}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {selectedConsignment.supplier?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedConsignment.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Received Date">
                {selectedConsignment.receivedDate 
                  ? new Date(selectedConsignment.receivedDate).toLocaleString() 
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Total Value">
                ${selectedConsignment.value?.toFixed(2) || '0.00'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Items</Divider>

            <Table
              dataSource={selectedConsignment.items}
              columns={[
                { title: 'Product', dataIndex: 'productName', key: 'productName' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                { 
                  title: 'Unit Price', 
                  dataIndex: 'unitPrice', 
                  key: 'unitPrice', 
                  render: (val) => `$${val || '0.00'}` 
                }
              ]}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Drawer>

      {/* New Consignment Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: theme.primaryColor }} />
            <span>Create New Consignment</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          form.resetFields();
          setSelectedProducts([]);
          setModalVisible(false);
        }}
        onOk={handleSubmitConsignment}
        width={800}
        confirmLoading={submitting}
        okText="Create Consignment"
        okButtonProps={{ style: { background: theme.primaryColor } }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label="Supplier"
            name="userId"
            rules={[{ required: true, message: 'Please select a supplier' }]}
          >
            <Select
              showSearch
              placeholder="Search and select supplier"
              suffixIcon={<UserOutlined />}
              filterOption={false}
              onSearch={searchSuppliers}
              loading={searchingSuppliers}
              notFoundContent={searchingSuppliers ? <Spin size="small" /> : 'Start typing to search...'}
              style={{ width: '100%' }}
            >
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: theme.primaryColor }}>
                      {supplier.name?.charAt(0)}
                    </Avatar>
                    <div>
                      <div>{supplier.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{supplier.email}</Text>
                    </div>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Country"
            name="countryId"
            rules={[{ required: true, message: 'Please select a country' }]}
          >
            <Select
              placeholder="Select destination country"
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {countries.map(country => (
                <Option key={country.id} value={country.id}>
                  {country.countryName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Products</Divider>

          <Form.Item label="Add Products">
            <Select
              showSearch
              placeholder="Search and add products"
              suffixIcon={<ShoppingOutlined />}
              filterOption={false}
              onSearch={searchProducts}
              onChange={handleAddProduct}
              loading={searchingProducts}
              notFoundContent={searchingProducts ? <Spin size="small" /> : 'Start typing to search...'}
              style={{ width: '100%' }}
              value={null}
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  <Space>
                    <ShoppingOutlined />
                    <div>
                      <div>{product.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {product.code || product.sku || 'No code'}
                      </Text>
                    </div>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedProducts.length > 0 && (
            <List
              bordered
              dataSource={selectedProducts}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveProduct(item.productId)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<ShoppingOutlined />} />}
                    title={item.productName}
                  />
                  <Space style={{ marginRight: 16 }}>
                    <InputNumber
                      min={1}
                      value={item.quantity}
                      onChange={(value) => handleUpdateProduct(item.productId, 'quantity', value)}
                      style={{ width: 100 }}
                      placeholder="Qty"
                    />
                    <Select
                      value={item.unitOfMeasure}
                      onChange={(value) => handleUpdateProduct(item.productId, 'unitOfMeasure', value)}
                      style={{ width: 150 }}
                    >
                      {UNIT_OF_MEASURE.map(unit => (
                        <Option key={unit.value} value={unit.value}>
                          {unit.label}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </List.Item>
              )}
            />
          )}

          {selectedProducts.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              background: '#fafafa',
              borderRadius: 8,
              border: '1px dashed #d9d9d9'
            }}>
              <ShoppingOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
              <div style={{ marginTop: 16, color: '#8c8c8c' }}>
                No products added yet. Search and add products above.
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

// ==================== USERS MODULE ====================

const UsersModule = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const { theme } = useTheme();

  const permissions = [
    'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_DELETE',
    'PRODUCTS_VIEW', 'PRODUCTS_CREATE', 'PRODUCTS_EDIT', 'PRODUCTS_DELETE',
    'EXPORTS_VIEW', 'EXPORTS_CREATE', 'EXPORTS_EDIT', 'EXPORTS_DELETE',
    'ACCOUNTING_VIEW', 'ACCOUNTING_CREATE', 'ACCOUNTING_EDIT',
    'USERS_VIEW', 'USERS_CREATE', 'USERS_EDIT', 'USERS_DELETE',
    'ADMIN'
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(
        {
        page: 1,
        size: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      }
      );
      setUsers(data.content);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await api.createUser(values);
        message.success('User created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      message.error('Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            style={{ 
              backgroundColor: theme.primaryColor,
              fontWeight: 600
            }}
          >
            {record.name?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Space size={4} wrap>
          {permissions?.slice(0, 3).map(p => (
            <Tag key={p} style={{ fontSize: 11 }}>{p}</Tag>
          ))}
          {permissions?.length > 3 && (
            <Tag>+{permissions.length - 3} more</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete user?"
            onConfirm={() => {
              message.success('User deleted');
              loadUsers();
            }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card 
        title={
          <Space>
            <UserOutlined style={{ color: theme.primaryColor }} />
            <span>Users & Permissions</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setModalVisible(true);
            }}
            style={{ background: theme.primaryColor }}
          >
            Add User
          </Button>
        }
        style={{ borderRadius: 12 }}
      >
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* User Form Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: !editingUser, message: 'Please enter password' }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select>
              <Option value="ADMIN">Admin</Option>
              <Option value="MANAGER">Manager</Option>
              <Option value="SALES">Sales Staff</Option>
              <Option value="ACCOUNTANT">Accountant</Option>
              <Option value="VIEWER">Viewer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissions"
          >
            <Checkbox.Group options={permissions} />
          </Form.Item>

          <Form.Item
            name="active"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== PRODUCTS MODULE ====================

const ProductsModule = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();
  const { theme } = useTheme();

  useEffect(() => {
    console.log("Loading products")
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ page: 1, size: 10, sortBy: 'createdAt', sortOrder: 'DESC' });
      setProducts(data.content);
    
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };


    const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    
    } catch (error) {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, values);
        message.success('Product updated successfully');
      } else {
        await api.createProduct(values);
        message.success('Product created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      message.error('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProduct(id);
      message.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <Space>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: `${theme.primaryColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AppstoreOutlined style={{ fontSize: 24, color: theme.primaryColor }} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>SKU: {record.productCode}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (category) => <Tag>{category}</Tag>
    },
    {
      title: 'Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price) => <Text strong style={{ color: theme.primaryColor }}>${price?.toFixed(2)}</Text>
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'stock',
      render: (stock) => (
        <Tag color={stock > 50 ? 'success' : stock > 10 ? 'warning' : 'error'}>
          {stock} units
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete product?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card 
        title={
          <Space>
            <AppstoreOutlined style={{ color: theme.primaryColor }} />
            <span>Products</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProduct(null);
              form.resetFields();
              setModalVisible(true);
            }}
            style={{ background: theme.primaryColor }}
          >
            Add Product
          </Button>
        }
        style={{ borderRadius: 12 }}
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: `${theme.primaryColor}10` }}>
              <Statistic
                title="Total Products"
                value={products.length}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: theme.primaryColor }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: '#52c41a10' }}>
              <Statistic
                title="Active"
                value={products.length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: '#faad1410' }}>
              <Statistic
                title="Low Stock"
                value={products.filter(p => p.stock < 10).length}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 8, background: '#f5222d10' }}>
              <Statistic
                title="Out of Stock"
                value={products.filter(p => p.stock === 0).length}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="productId"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Product Form Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingProduct(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="productName"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productCode"
                label="Code"
                rules={[{ required: true, message: 'Please enter product Code' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productCategoryId"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select
                  placeholder="Select category"
                  loading={!categories.length}
                  allowClear
                >
                  {categories.map(category => (
                    <Select.Option key={category.id} value={category.id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purpose"
                label="Purpose"
                rules={[{ required: true, message: 'Please select purpose' }]}
              >

                  <Select> 
                    <Option value="EXPORT">Export</Option> 
                    <Option value="INTERNAL">Internal</Option>
                     <Option value="IMPORT">Import</Option> 
                     <Option value="SALES">Sale</Option>
                      </Select>
            
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="productDescription"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="unitPrice"
                label="Buying Price"
                rules={[{ required: true, message: 'Please enter buying price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sellProce"
                label="Selling Price"
                 rules={[{ required: true, message: 'Please enter selling  price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== ACCOUNTING MODULE ====================

const AccountingModule = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { theme } = useTheme();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (error) {
      message.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await api.createTransaction(values);
      message.success('Transaction recorded successfully');
      setModalVisible(false);
      form.resetFields();
      loadTransactions();
    } catch (error) {
      message.error('Failed to record transaction');
    }
  };

  const calculateTotals = () => {
    const paidOut = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const received = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    return { paidOut, received, net: received - paidOut };
  };

  const totals = calculateTotals();

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.date) - new Date(b.date)
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag>{category}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'INCOME' ? 'success' : 'error'}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <Text 
          strong 
          style={{ 
            color: record.type === 'INCOME' ? '#52c41a' : '#f5222d',
            fontSize: 15
          }}
        >
          {record.type === 'INCOME' ? '+' : '-'}${amount.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod'
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref) => <Text type="secondary">{ref}</Text>
    }
  ];

  return (
    <div>
      <Card 
        title={
          <Space>
            <DollarOutlined style={{ color: theme.primaryColor }} />
            <span>Accounting & Transactions</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setModalVisible(true);
            }}
            style={{ background: theme.primaryColor }}
          >
            Record Transaction
          </Button>
        }
        style={{ borderRadius: 12 }}
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card style={{ borderRadius: 8, background: '#f5222d10' }}>
              <Statistic
                title="Total Paid Out"
                value={totals.paidOut}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ borderRadius: 8, background: '#52c41a10' }}>
              <Statistic
                title="Total Received"
                value={totals.received}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ borderRadius: 8, background: `${theme.primaryColor}10` }}>
              <Statistic
                title="Net"
                value={totals.net}
                prefix="$"
                precision={2}
                valueStyle={{ color: totals.net >= 0 ? '#52c41a' : '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Transaction Form Modal */}
      <Modal
        title="Record Transaction"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'EXPENSE',
            date: new Date().toISOString(),
            paymentMethod: 'CASH'
          }}
        >
          <Form.Item
            name="type"
            label="Transaction Type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Radio.Group>
              <Radio.Button value="EXPENSE">Expense (Paid Out)</Radio.Button>
              <Radio.Button value="INCOME">Income (Received)</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="e.g., Office supplies, Supplier payment" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select>
                  <Option value="Salary">Salary</Option>
                  <Option value="Rent">Rent</Option>
                  <Option value="Utilities">Utilities</Option>
                  <Option value="Supplies">Supplies</Option>
                  <Option value="Inventory">Inventory Purchase</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Services">Services</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
              >
                <Select>
                  <Option value="CASH">Cash</Option>
                  <Option value="BANK_TRANSFER">Bank Transfer</Option>
                  <Option value="CREDIT_CARD">Credit Card</Option>
                  <Option value="MOBILE_MONEY">Mobile Money</Option>
                  <Option value="CHECK">Check</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reference"
                label="Reference Number"
              >
                <Input placeholder="Invoice #, Receipt #" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== MAIN APP COMPONENT ====================

const App = () => {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('exports');
  const [theme, setTheme] = useState({
    primaryColor: '#1c1c22ff',
    secondaryColor: '#8b5cf6',
    companyName: 'MyCompany'
  });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.setToken(token);
    }

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(JSON.parse(savedTheme));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('user');
    message.info('Logged out successfully');
  };

  const updateTheme = (newTheme) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    localStorage.setItem('theme', JSON.stringify(updatedTheme));
  };

  const menuItems = [
    {
      key: 'sales',
      icon: <ShoppingCartOutlined />,
      label: 'Sales / POS',
      permission: 'SALES_VIEW'
    },
    {
      key: 'exports',
      icon: <ExportOutlined />,
      label: 'Exports',
      permission: 'EXPORTS_VIEW'
    },
    {
      key: 'products',
      icon: <AppstoreOutlined />,
      label: 'Products',
      permission: 'VIEW_PRODUCT'
    },
    {
      key: 'accounting',
      icon: <DollarOutlined />,
      label: 'Accounting',
      permission: 'ACCOUNTING_VIEW'
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Users',
      permission: 'VIEW_USERS'
    }
  ];

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions?.includes(permission) || user.permissions?.includes('ADMIN');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'sales':
        return <SalesModule />;
      case 'exports':
        return <ExportsModule />;
      case 'products':
        return <ProductsModule />;
      case 'accounting':
        return <AccountingModule />;
      case 'users':
        return <UsersModule />;
      default:
        return <SalesModule />;
    }
  };

  if (!user) {
    return (
      <ThemeContext.Provider value={{ theme, updateTheme }}>
        <LoginPage onLogin={handleLogin} />
      </ThemeContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      <ThemeContext.Provider value={{ theme, updateTheme }}>
        <Layout style={{ minHeight: '100vh', fontFamily: '"Outfit", sans-serif' }}>
          <Sider 
            trigger={null} 
            collapsible 
            collapsed={collapsed}
            style={{
              background: 'white',
              boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 100
            }}
          >
            <div style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #f0f0f0',
              padding: '0 16px'
            }}>
              {!collapsed ? (
                <Title level={4} style={{ 
                  margin: 0, 
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700
                }}>
                  {theme.companyName}
                </Title>
              ) : (
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 18
                }}>
                  {theme.companyName.charAt(0)}
                </div>
              )}
            </div>

            <Menu
              mode="inline"
              selectedKeys={[currentPage]}
              onClick={({ key }) => setCurrentPage(key)}
              style={{ border: 'none', padding: '8px 0' }}
              items={menuItems
                .filter(item => hasPermission(item.permission))
                .map(item => ({
                  key: item.key,
                  icon: item.icon,
                  label: item.label
                }))
              }
            />
          </Sider>

          <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
            <Header style={{
              background: 'white',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              position: 'sticky',
              top: 0,
              zIndex: 99
            }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 18 }}
              />

              <Space size="middle">
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'theme',
                        label: 'Theme Settings',
                        icon: <SettingOutlined />,
                        onClick: () => {
                          Modal.info({
                            title: 'Theme Settings',
                            width: 500,
                            content: (
                              <div style={{ marginTop: 16 }}>
                                <Form layout="vertical">
                                  <Form.Item label="Company Name">
                                    <Input
                                      defaultValue={theme.companyName}
                                      onChange={(e) => updateTheme({ companyName: e.target.value })}
                                    />
                                  </Form.Item>
                                  <Form.Item label="Primary Color">
                                    <Input
                                      type="color"
                                      defaultValue={theme.primaryColor}
                                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                    />
                                  </Form.Item>
                                  <Form.Item label="Secondary Color">
                                    <Input
                                      type="color"
                                      defaultValue={theme.secondaryColor}
                                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                                    />
                                  </Form.Item>
                                </Form>
                              </div>
                            )
                          });
                        }
                      },
                      {
                        type: 'divider'
                      },
                      {
                        key: 'logout',
                        label: 'Logout',
                        icon: <LogoutOutlined />,
                        danger: true,
                        onClick: handleLogout
                      }
                    ]
                  }}
                >
                  <Space style={{ cursor: 'pointer' }}>
                    <Avatar style={{ backgroundColor: theme.primaryColor }}>
                      {user.name?.charAt(0)}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{user.role}</Text>
                    </div>
                  </Space>
                </Dropdown>
              </Space>
            </Header>

            <Content style={{ 
              margin: 24, 
              minHeight: 'calc(100vh - 112px)'
            }}>
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
